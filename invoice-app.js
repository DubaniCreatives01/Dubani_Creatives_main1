import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./js/supabase-client.js";
import { requireOwner } from "./js/auth-guard.js";
import {
    BUCKET,
    SIGNED_URL_SECONDS,
    inspectUpload,
    storagePath,
    canPreview,
    isPdf,
    formatBytes,
    formatZar,
    parseAmount,
    entryFromApp,
    entryFromUpload,
    invoiceTotal,
    displayedPaid,
    payStatus,
    togglePlan,
    countsInTotals,
    summarise,
    clientSummaries,
    isOverdueEntry,
    missingLedgerColumn,
    missingUploadsTable,
    missingPaidEvents,
} from "./js/invoice-ledger.mjs";

const $ = (id) => document.getElementById(id);

function errText(error) {
    if (!error) return "Request failed.";
    return [error.message, error.details, error.hint].filter(Boolean).join(" — ");
}

function round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function saToday() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Johannesburg",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function addDays(iso, days) {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function money(amount) {
    return `ZAR ${round2(amount).toFixed(2)}`;
}

function isOverdue(row) {
    return isOverdueEntry(row, saToday());
}

const STATUS_LABEL = {
    draft: "Draft",
    sent: "Sent",
    partially_paid: "Partially paid",
    paid: "Paid",
    void: "Void",
    accepted: "Accepted",
    declined: "Declined",
    converted: "Converted",
};

const App = {
    session: null,
    settings: {},
    clients: [],
    services: [],
    documents: [],
    uploads: [],
    ledger: [],
    ledgerReady: true,
    uploadsReady: true,
    paidColumnReady: true,
    payFilter: "",
    paidEvents: [],
    uploadQueue: [],
    uploading: false,
    payments: [],
    logoBase64: "images/logo1.png",
    logoSize: { width: 2248, height: 337 },
    state: null,

    blankState() {
        const today = saToday();
        const dueDays = Number(this.settings.default_due_days ?? 7);
        return {
            id: null,
            kind: "invoice",
            status: "draft",
            reference: "",
            number: null,
            nextRef: "",
            title: "",
            issueDate: today,
            dueDate: addDays(today, dueDays),
            clientId: null,
            client: { name: "", email: "", phone: "", address: "" },
            vatEnabled: Boolean(this.settings.vat_registered),
            vatRate: 15,
            discountInput: 0,
            discountType: "fixed",
            amountPaid: 0,
            balanceDue: 0,
            notes: "",
            paymentInstructions: this.settings.payment_instructions || "",
            items: [{ serviceId: "", title: "", description: "", quantity: 1, unitPrice: 0 }],
        };
    },

    showBanner(text, kind) {
        const banner = $("appBanner");
        banner.hidden = false;
        banner.className = "app-banner " + (kind || "");
        banner.textContent = text;
    },

    clearBanner() {
        $("appBanner").hidden = true;
        $("appBanner").textContent = "";
    },

    setLinkStatus(ok, message) {
        const badge = $("cloudStatusBadge");
        badge.classList.toggle("synced", ok);
        badge.classList.toggle("error", !ok);
        badge.textContent = ok ? "Connected" : (message || "Not connected");
    },

    async init() {
        this.session = await requireOwner();
        if (!this.session) return;
        this.bindStaticEvents();
        this.showBanner("Loading documents from Supabase…", "loading");
        const setup = await supabase.rpc("ensure_owner_setup");
        if (setup.error) {
            this.setLinkStatus(false, "Setup failed");
            this.showBanner(errText(setup.error), "error");
            return;
        }
        const loaded = await this.loadReferenceData();
        if (!loaded) return;
        await this.preloadLogo();
        const params = new URLSearchParams(location.search);
        const requested = params.get("id");
        const clientFocus = params.get("client");
        if (requested) {
            const opened = await this.openDocument(requested);
            if (!opened) await this.newDocument();
        } else {
            await this.newDocument();
        }
        if (clientFocus && !requested) await this.openLedger(clientFocus);
        this.setLinkStatus(true);
        if (!$("appBanner").classList.contains("error")) this.clearBanner();
    },

    async loadReferenceData() {
        const [settingsRes, clientsRes, servicesRes] = await Promise.all([
            supabase.from("business_settings").select("*").maybeSingle(),
            supabase.from("clients").select("*").order("name"),
            supabase.from("services").select("*").eq("active", true).order("sort_order"),
        ]);
        const error = settingsRes.error || clientsRes.error || servicesRes.error;
        if (error) {
            this.setLinkStatus(false, "Could not load");
            this.showBanner(errText(error), "error");
            return false;
        }
        this.settings = settingsRes.data || {};
        this.clients = clientsRes.data || [];
        this.services = servicesRes.data || [];
        this.fillClientPickers();
        return true;
    },

    async preloadLogo() {
        try {
            const img = new Image();
            img.src = "images/logo1.png";
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d").drawImage(img, 0, 0);
            this.logoSize = {
                width: img.naturalWidth || this.logoSize.width,
                height: img.naturalHeight || this.logoSize.height,
            };
            this.logoBase64 = canvas.toDataURL("image/png");
        } catch {
            this.logoBase64 = "images/logo1.png";
        }
    },

    fillClientPickers() {
        const options = ['<option value="">— Select saved client —</option>']
            .concat(this.clients.filter((client) => !client.archived).map((client) =>
                `<option value="${esc(client.id)}">${esc(client.name)}</option>`));
        $("clientSelect").innerHTML = options.join("");
        const clientOptions = this.clients.map((client) => `<option value="${esc(client.id)}">${esc(client.name)}</option>`).join("");
        const selectedFilter = $("filterClient").value;
        const selectedUpload = $("uploadClient").value;
        $("filterClient").innerHTML = `<option value="">All clients</option>${clientOptions}`;
        $("uploadClient").innerHTML = `<option value="">Choose a client</option>${this.clients.filter((client) => !client.archived).map((client) => `<option value="${esc(client.id)}">${esc(client.name)}</option>`).join("")}`;
        if (selectedFilter) $("filterClient").value = selectedFilter;
        if (selectedUpload) $("uploadClient").value = selectedUpload;
        $("clientNames").innerHTML = this.clients
            .filter((client) => !client.archived)
            .map((client) => `<option value="${esc(client.name)}"></option>`)
            .join("");
    },

    async peekNext(kind) {
        const { data, error } = await supabase.rpc("peek_next_reference", { p_kind: kind });
        if (error) {
            this.showBanner(errText(error), "error");
            return "";
        }
        return data || "";
    },

    async newDocument() {
        this.state = this.blankState();
        this.state.nextRef = await this.peekNext(this.state.kind);
        this.payments = [];
        history.replaceState(null, "", "invoice.html");
        this.render();
    },

    readForm() {
        const state = this.state;
        state.kind = $("docKind").value;
        state.title = $("docTitle").value.trim();
        state.issueDate = $("invoiceDate").value;
        state.dueDate = $("dueDate").value;
        state.client.name = $("clientName").value.trim();
        state.client.email = $("clientEmail").value.trim();
        state.client.phone = $("clientPhone").value.trim();
        state.client.address = $("clientAddress").value.trim();
        state.vatEnabled = $("vatEnabled").value === "on";
        state.discountInput = Number($("discount").value) || 0;
        state.discountType = $("discountType").value;
        state.notes = $("invoiceNotes").value;
        state.paymentInstructions = $("paymentInstructions").value;
    },

    lineTotal(item) {
        return round2((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
    },

    subtotal() {
        return round2(this.state.items.reduce((sum, item) => sum + this.lineTotal(item), 0));
    },

    discountAmount() {
        const sub = this.subtotal();
        const raw = Math.max(0, Number(this.state.discountInput) || 0);
        if (this.state.discountType === "percent") return Math.min(sub, round2(sub * raw / 100));
        return Math.min(sub, round2(raw));
    },

    vatAmount() {
        if (!this.state.vatEnabled) return 0;
        return round2((this.subtotal() - this.discountAmount()) * 15 / 100);
    },

    total() {
        return round2(this.subtotal() - this.discountAmount() + this.vatAmount());
    },

    balance() {
        return round2(this.total() - (Number(this.state.amountPaid) || 0));
    },

    companyLines() {
        const settings = this.settings;
        return [
            settings.trading_name,
            settings.legal_name && settings.legal_name !== settings.trading_name ? settings.legal_name : "",
            settings.address,
            [settings.city, settings.country].filter(Boolean).join(", "),
            settings.email,
            settings.phone,
            settings.website,
            settings.company_reg_number ? `Reg. ${settings.company_reg_number}` : "",
            settings.tax_number ? `Tax ${settings.tax_number}` : "",
            settings.vat_number ? `VAT ${settings.vat_number}` : "",
        ].filter(Boolean);
    },

    paymentBlock() {
        const settings = this.settings;
        return [
            settings.bank_name,
            settings.account_holder ? `Account holder: ${settings.account_holder}` : "",
            settings.account_number ? `Account: ${settings.account_number}` : "",
            settings.branch_code ? `Branch: ${settings.branch_code}` : "",
            settings.account_type || "",
            settings.payment_instructions || "",
        ].filter(Boolean).join("\n");
    },

    displayReference() {
        const state = this.state;
        if (!state) return "";
        return state.reference || state.nextRef || "";
    },

    render() {
        const state = this.state;
        const locked = state.status !== "draft";
        $("docKind").value = state.kind;
        $("docKind").disabled = Boolean(state.id);
        $("docReference").value = this.displayReference();
        $("docStatus").value = STATUS_LABEL[state.status] || state.status;
        $("docTitle").value = state.title || "";
        $("invoiceDate").value = state.issueDate || "";
        $("dueDate").value = state.dueDate || "";
        $("clientSelect").value = state.clientId || "";
        $("clientName").value = state.client.name || "";
        $("clientEmail").value = state.client.email || "";
        $("clientPhone").value = state.client.phone || "";
        $("clientAddress").value = state.client.address || "";
        $("vatEnabled").value = state.vatEnabled ? "on" : "off";
        $("discount").value = String(state.discountInput ?? 0);
        $("discountType").value = state.discountType || "fixed";
        $("invoiceNotes").value = state.notes || "";
        $("paymentInstructions").value = state.paymentInstructions || "";
        [
            "docTitle", "invoiceDate", "dueDate", "clientSelect", "clientName", "clientEmail",
            "clientPhone", "clientAddress", "vatEnabled", "discount", "discountType",
            "invoiceNotes", "paymentInstructions", "saveClientBtn", "addItemBtn",
        ].forEach((id) => { $(id).disabled = locked; });
        $("saveInvoiceBtn").hidden = locked;
        $("finaliseBtn").hidden = locked;
        $("deleteDraftBtn").hidden = !(state.id && !locked);
        $("duplicateBtn").hidden = !state.id;
        $("markPaidBtn").hidden = !(state.kind === "invoice" && ["sent", "partially_paid", "paid"].includes(state.status));
        $("convertBtn").hidden = !(state.kind === "quote" && ["sent", "accepted"].includes(state.status));
        $("acceptBtn").hidden = !(state.kind === "quote" && state.status === "sent");
        $("declineBtn").hidden = !(state.kind === "quote" && ["sent", "accepted"].includes(state.status));
        $("voidBtn").hidden = !state.id || ["draft", "void", "converted"].includes(state.status);
        this.renderItems();
        this.updatePreview();
    },

    renderItems() {
        const locked = this.state.status !== "draft";
        const serviceOptions = ['<option value="">Service catalogue</option>']
            .concat(this.services.map((service) => `<option value="${esc(service.id)}">${esc(service.name)}</option>`))
            .join("");
        $("itemsBody").innerHTML = this.state.items.map((item, index) => `
            <tr data-idx="${index}">
                <td>
                    <select class="form-select item-service" ${locked ? "disabled" : ""}>${serviceOptions}</select>
                    <input class="form-input item-title" value="${esc(item.title)}" placeholder="Line title" ${locked ? "disabled" : ""}>
                </td>
                <td><input class="form-input item-desc" value="${esc(item.description)}" ${locked ? "disabled" : ""}></td>
                <td><input class="form-input item-qty" type="number" min="0.01" step="0.01" value="${esc(item.quantity)}" ${locked ? "disabled" : ""}></td>
                <td><input class="form-input item-rate" type="number" min="0" step="0.01" value="${esc(item.unitPrice)}" ${locked ? "disabled" : ""}></td>
                <td><span class="line-total">${money(this.lineTotal(item))}</span></td>
                <td>${locked ? "" : `<button type="button" class="btn btn-danger btn-sm remove-item">×</button>`}</td>
            </tr>
        `).join("");
        $("itemsBody").querySelectorAll(".item-service").forEach((select, index) => {
            select.value = this.state.items[index].serviceId || "";
        });
        this.paintTotals();
    },

    paintTotals() {
        $("formSubtotal").textContent = money(this.subtotal());
        $("formDiscount").textContent = "- " + money(this.discountAmount());
        $("formTax").textContent = money(this.vatAmount());
        $("formTotal").textContent = money(this.total());
    },

    updatePreview() {
        const state = this.state;
        const sub = this.subtotal();
        const discount = this.discountAmount();
        const vat = this.vatAmount();
        const total = this.total();
        const balance = this.balance();
        const paid = Number(state.amountPaid) || 0;
        const heading = state.kind === "quote" ? "QUOTE" : "INVOICE";
        const number = this.displayReference();
        let watermark = "";
        if (state.status === "paid") watermark = `<div class="inv-watermark-stamp">PAID FULL</div>`;
        else if (state.status === "partially_paid") {
            watermark = `<div class="inv-watermark-stamp partial">PARTIALLY PAID<div style="font-size:13px;">PAID ${money(paid)} · BAL ${money(balance)}</div></div>`;
        } else if (state.status === "void") {
            watermark = `<div class="inv-watermark-stamp" style="color:#ff4444;border-color:#ff4444;">VOID</div>`;
        }
        const rows = state.items.filter((item) => item.title).map((item) => `
            <tr>
                <td><div class="inv-item-name">${esc(item.title)}</div>${item.description ? `<div class="inv-item-desc">${esc(item.description)}</div>` : ""}</td>
                <td>${esc(item.quantity)}</td>
                <td>${money(item.unitPrice)}</td>
                <td>${money(this.lineTotal(item))}</td>
            </tr>`).join("");
        const from = this.companyLines().map(esc).join("<br>");
        const late = isOverdue(state);
        $("invoicePreview").innerHTML = `
            ${watermark}
            <div class="inv-header">
                <div class="inv-logo"><img src="${this.logoBase64}" alt="Dubani Creatives"></div>
                <div class="inv-title-block">
                    <div class="inv-title">${heading}</div>
                    <div class="inv-number">${esc(number)}</div>
                </div>
            </div>
            <div class="inv-details-grid">
                <div class="inv-from"><p>${from || "Business details load from settings."}</p></div>
                <div class="inv-dates">
                    <table class="inv-dates-table">
                        <tr><td>Date:</td><td>${esc(state.issueDate || "—")}</td></tr>
                        <tr><td>Due:</td><td>${esc(state.dueDate || "—")}</td></tr>
                    </table>
                    <div class="inv-balance-due" style="${state.status === "paid" ? "background:#25D366;" : ""}">
                        <span>Balance due${late ? " · overdue" : ""}:</span>
                        <span>${money(balance)}</span>
                    </div>
                </div>
            </div>
            <div style="margin-bottom:24px;">
                <h4 style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:4px;">Bill to</h4>
                <p style="font-size:14px;color:#1a1a1a;"><strong>${esc(state.client.name) || "—"}</strong><br>
                ${state.client.phone ? esc(state.client.phone) + "<br>" : ""}
                ${state.client.email ? esc(state.client.email) + "<br>" : ""}
                ${esc(state.client.address || "")}</p>
            </div>
            <table class="inv-items-table">
                <thead><tr><th>Item</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#ccc;padding:20px;">No items yet</td></tr>'}</tbody>
            </table>
            <div class="inv-totals"><table class="inv-totals-table">
                <tr><td>Subtotal:</td><td>${money(sub)}</td></tr>
                ${discount > 0 ? `<tr><td>Discount:</td><td>- ${money(discount)}</td></tr>` : ""}
                <tr><td>VAT${state.vatEnabled ? " (15%)" : ""}:</td><td>${money(vat)}</td></tr>
                <tr class="inv-grand-total"><td>Total:</td><td>${money(total)}</td></tr>
                ${paid > 0 ? `<tr><td>Amount paid:</td><td>- ${money(paid)}</td></tr>` : ""}
                <tr><td>Balance due:</td><td>${money(balance)}</td></tr>
            </table></div>
            ${state.notes ? `<div class="inv-notes"><h4>Notes</h4><p>${esc(state.notes).replace(/\n/g, "<br>")}</p></div>` : ""}
            ${state.paymentInstructions ? `<div class="inv-notes"><h4>Payment</h4><p>${esc(state.paymentInstructions).replace(/\n/g, "<br>")}</p></div>` : ""}
            ${(this.settings.payment_terms || this.settings.terms_and_conditions) ? `<div class="inv-terms"><h4>Terms</h4><p>${esc([this.settings.payment_terms, this.settings.terms_and_conditions].filter(Boolean).join("\n\n")).replace(/\n/g, "<br>")}</p></div>` : ""}
        `;
    },

    applyClient(client) {
        this.state.clientId = client.id;
        this.state.client = {
            name: client.name || "",
            email: client.email || "",
            phone: client.phone || "",
            address: client.address || "",
        };
        const snapshot = client;
        if (this.state.status === "draft" && snapshot.payment_terms_days != null && this.state.issueDate) {
            this.state.dueDate = addDays(this.state.issueDate, snapshot.payment_terms_days);
        }
        this.render();
    },

    async ensureClient() {
        this.readForm();
        const name = this.state.client.name;
        if (!name) throw new Error("Choose or enter a client before saving.");
        const match = this.clients.find((client) => client.name.trim().toLowerCase() === name.toLowerCase() && !client.archived);
        if (this.state.clientId) return this.state.clientId;
        if (match) {
            this.state.clientId = match.id;
            return match.id;
        }
        const { data, error } = await supabase.from("clients").insert({
            name,
            email: this.state.client.email || null,
            phone: this.state.client.phone || null,
            address: this.state.client.address || null,
        }).select("*").single();
        if (error) throw error;
        this.clients.push(data);
        this.fillClientPickers();
        this.state.clientId = data.id;
        return data.id;
    },

    async replaceItems(invoiceId) {
        const rows = this.state.items
            .filter((item) => item.title && item.title.trim())
            .map((item, position) => ({
                invoice_id: invoiceId,
                position,
                service_id: item.serviceId || null,
                title: item.title.trim(),
                description: item.description || null,
                quantity: Number(item.quantity),
                unit_price: Number(item.unitPrice) || 0,
            }));
        for (const row of rows) {
            if (!(row.quantity > 0)) throw new Error(`Quantity for “${row.title}” must be greater than 0.`);
            if (row.unit_price < 0) throw new Error(`Price for “${row.title}” cannot be negative.`);
        }
        const existing = await supabase.from("invoice_items").select("id").eq("invoice_id", invoiceId);
        if (existing.error) throw existing.error;
        if (existing.data.length) {
            const removed = await supabase.from("invoice_items").delete().in("id", existing.data.map((row) => row.id));
            if (removed.error) throw removed.error;
        }
        if (!rows.length) return;
        const inserted = await supabase.from("invoice_items").insert(rows);
        if (inserted.error) throw inserted.error;
    },

    async saveDraft(quiet) {
        try {
            if (this.state.status !== "draft") {
                this.showBanner("Finalised documents cannot be edited. Duplicate it, or void it with a reason.", "error");
                return false;
            }
            const clientId = await this.ensureClient();
            const payload = {
                client_id: clientId,
                title: this.state.title || null,
                issue_date: this.state.issueDate || null,
                due_date: this.state.dueDate || null,
                currency: "ZAR",
                vat_enabled: this.state.vatEnabled,
                vat_rate: 15,
                discount_amount: this.discountAmount(),
                notes: this.state.notes || null,
                payment_instructions: this.state.paymentInstructions || null,
            };
            let id = this.state.id;
            if (!id) {
                const { data, error } = await supabase.from("invoices").insert({
                    kind: this.state.kind,
                    status: "draft",
                    ...payload,
                }).select("id").single();
                if (error) throw error;
                id = data.id;
                this.state.id = id;
            } else {
                const { error } = await supabase.from("invoices").update(payload).eq("id", id);
                if (error) throw error;
            }
            await this.replaceItems(id);
            await this.openDocument(id);
            if (!quiet) this.showBanner("Draft saved.", "ok");
            return true;
        } catch (error) {
            this.showBanner(errText(error), "error");
            return false;
        }
    },

    async openDocument(id) {
        const { data, error } = await supabase.from("invoices").select("*, clients(*), invoice_items(*), payments(*)").eq("id", id).maybeSingle();
        if (error) {
            this.showBanner(errText(error), "error");
            return false;
        }
        if (!data) {
            this.showBanner("That document was not found.", "error");
            return false;
        }
        const client = data.clients || {};
        const snapshot = data.client_snapshot || {};
        const source = data.status === "draft" ? client : { ...client, ...snapshot };
        this.payments = (data.payments || []).sort((a, b) => String(a.paid_on).localeCompare(String(b.paid_on)));
        this.state = {
            id: data.id,
            kind: data.kind,
            status: data.status,
            reference: data.reference || "",
            number: data.number,
            nextRef: "",
            title: data.title || "",
            issueDate: data.issue_date || "",
            dueDate: data.due_date || "",
            clientId: data.client_id,
            client: {
                name: source.name || "",
                email: source.email || "",
                phone: source.phone || "",
                address: source.address || "",
            },
            vatEnabled: Boolean(data.vat_enabled),
            vatRate: Number(data.vat_rate) || 15,
            discountInput: Number(data.discount_amount) || 0,
            discountType: "fixed",
            amountPaid: Number(data.amount_paid) || 0,
            balanceDue: Number(data.balance_due) || 0,
            notes: data.notes || "",
            paymentInstructions: data.payment_instructions || "",
            items: (data.invoice_items || [])
                .sort((a, b) => a.position - b.position)
                .map((item) => ({
                    serviceId: item.service_id || "",
                    title: item.title || "",
                    description: item.description || "",
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unit_price),
                })),
        };
        if (!this.state.items.length && data.status === "draft") {
            this.state.items.push({ serviceId: "", title: "", description: "", quantity: 1, unitPrice: 0 });
        }
        if (data.status === "draft" && !data.reference) this.state.nextRef = await this.peekNext(data.kind);
        history.replaceState(null, "", `invoice.html?id=${encodeURIComponent(data.id)}`);
        this.render();
        return true;
    },

    async finalise() {
        const saved = await this.saveDraft(true);
        if (!saved || !this.state.id) return;
        const { error } = await supabase.rpc("finalise_document", { p_id: this.state.id });
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        await this.openDocument(this.state.id);
        this.showBanner(`Issued ${this.state.reference || "document"}.`, "ok");
    },

    async duplicate() {
        if (!this.state.id) return;
        const { data, error } = await supabase.rpc("duplicate_document", { p_id: this.state.id });
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        await this.openDocument(data);
        this.showBanner("Duplicated as a new draft.", "ok");
    },

    async convertQuote() {
        const { data, error } = await supabase.rpc("convert_quote_to_invoice", { p_quote_id: this.state.id });
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        await this.openDocument(data);
        this.showBanner("Quote converted to a draft invoice.", "ok");
    },

    async setStatus(status, extra) {
        const { error } = await supabase.from("invoices").update({ status, ...extra }).eq("id", this.state.id);
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        await this.openDocument(this.state.id);
        this.showBanner(`Status is now ${STATUS_LABEL[status] || status}.`, "ok");
    },

    async voidDocument() {
        const reason = window.prompt("Reason for voiding this document:");
        if (!reason || !reason.trim()) {
            this.showBanner("A reason is required to void a document.", "error");
            return;
        }
        await this.setStatus("void", { void_reason: reason.trim() });
    },

    async deleteDraft() {
        if (!this.state.id || this.state.status !== "draft") return;
        if (!window.confirm("Delete this draft? This cannot be undone.")) return;
        const { error: itemError } = await supabase.from("invoice_items").delete().eq("invoice_id", this.state.id);
        if (itemError) {
            this.showBanner(errText(itemError), "error");
            return;
        }
        const { error } = await supabase.from("invoices").delete().eq("id", this.state.id);
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        this.showBanner("Draft deleted.", "ok");
        await this.newDocument();
    },

    async loadDocuments() {
        const full = "id, kind, number, reference, status, title, issue_date, due_date, total, amount_paid, balance_due, client_id, created_at, tracked_amount, marked_paid, clients(name)";
        const base = "id, kind, number, reference, status, title, issue_date, due_date, total, amount_paid, balance_due, client_id, created_at, clients(name)";
        let invoiceRes = await supabase.from("invoices").select(full).order("created_at", { ascending: false });
        this.ledgerReady = true;
        if (invoiceRes.error && missingLedgerColumn(invoiceRes.error)) {
            this.ledgerReady = false;
            invoiceRes = await supabase.from("invoices").select(base).order("created_at", { ascending: false });
        }
        if (invoiceRes.error) {
            $("invoicesList").innerHTML = `<p class="empty-state">${esc(errText(invoiceRes.error))}</p>`;
            return;
        }
        this.documents = invoiceRes.data || [];
        const uploadFull = "id, client_id, name, storage_path, mime_type, size_bytes, amount, amount_paid, paid, issue_date, created_at";
        const uploadBase = "id, client_id, name, storage_path, mime_type, size_bytes, amount, paid, issue_date, created_at";
        let uploadRes = await supabase.from("invoice_uploads").select(uploadFull).order("created_at", { ascending: false });
        this.uploadsReady = true;
        this.paidColumnReady = true;
        if (uploadRes.error && /amount_paid/.test(`${uploadRes.error.message || ""} ${uploadRes.error.details || ""}`)) {
            this.paidColumnReady = false;
            uploadRes = await supabase.from("invoice_uploads").select(uploadBase).order("created_at", { ascending: false });
        }
        if (uploadRes.error && missingUploadsTable(uploadRes.error)) {
            this.uploadsReady = false;
            this.uploads = [];
        } else if (uploadRes.error) {
            $("invoicesList").innerHTML = `<p class="empty-state">${esc(errText(uploadRes.error))}</p>`;
            return;
        } else {
            this.uploads = uploadRes.data || [];
        }
        const eventRes = await supabase.from("invoice_paid_events")
            .select("id, invoice_id, upload_id, amount, delta, kind, created_at")
            .order("created_at", { ascending: false })
            .limit(300);
        this.paidEvents = eventRes.error && missingPaidEvents(eventRes.error) ? [] : (eventRes.data || []);
        const clientName = (id) => this.clients.find((client) => client.id === id)?.name;
        this.ledger = this.documents.map((row) => entryFromApp(row))
            .concat(this.uploads.map((row) => entryFromUpload({ ...row, client_name: clientName(row.client_id) })))
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        this.renderDocumentList();
    },

    async openLedger(clientId) {
        if (clientId) {
            $("filterClient").value = clientId;
            $("uploadClient").value = clientId;
        }
        this.showModal("invoicesModal");
        await this.loadDocuments();
    },

    filteredDocuments() {
        const query = $("searchInvoicesInput").value.trim().toLowerCase();
        const kind = $("filterKind").value;
        const status = $("filterStatus").value;
        const clientId = $("filterClient").value;
        const from = $("filterFrom").value;
        const to = $("filterTo").value;
        return this.ledger.filter((row) => {
            if (kind === "invoice" && !(row.kind === "invoice" || row.source === "upload")) return false;
            if (kind === "upload" && row.source !== "upload") return false;
            if (kind === "quote" && row.kind !== "quote") return false;
            if (this.payFilter) {
                if (!countsInTotals(row) || payStatus(row) !== this.payFilter) return false;
            }
            if (status === "unpaid" || status === "partial" || status === "paid") {
                if (!countsInTotals(row) || payStatus(row) !== status) return false;
            } else if (status && row.status !== status) {
                return false;
            }
            if (clientId && row.client_id !== clientId) return false;
            if (from && (!row.issue_date || row.issue_date < from)) return false;
            if (to && (!row.issue_date || row.issue_date > to)) return false;
            if (!query) return true;
            const hay = `${row.reference || ""} ${row.number || ""} ${row.title || ""} ${row.name || ""} ${row.client_name || ""}`.toLowerCase();
            return hay.includes(query);
        });
    },

    ledgerLabel(row) {
        if (row.source === "upload") return row.name || "Uploaded invoice";
        return row.reference || (row.number ? `#${row.number}` : "Draft");
    },

    renderDocumentList() {
        const notes = [];
        if (!this.ledgerReady) notes.push("Editing amount paid needs the invoice ledger columns.");
        if (!this.uploadsReady) notes.push("Uploading files needs the private invoice-uploads bucket.");
        if (this.uploadsReady && !this.paidColumnReady) notes.push("Amount paid on uploaded invoices needs the latest migration.");
        const setup = $("ledgerSetup");
        setup.hidden = notes.length === 0;
        setup.textContent = notes.length
            ? `${notes.join(" ")} Apply supabase/migrations/20261113131500_invoice_amount_paid.sql in the Supabase SQL editor, then reload.`
            : "";

        const clientId = $("filterClient").value;
        const scope = clientId ? this.ledger.filter((row) => row.client_id === clientId) : this.ledger;
        const totals = summarise(scope);
        const clientCount = new Set(scope.filter((row) => row.client_id).map((row) => row.client_id)).size;
        $("ledgerStats").innerHTML = [
            ["Invoiced", formatZar(totals.invoiced), ""],
            ["Received", formatZar(totals.paid), "paid"],
            ["Outstanding", formatZar(totals.outstanding), "outstanding"],
            ["Clients", String(clientCount), ""],
        ].map(([label, value, kind]) => `<article class="ledger-stat ${kind}"><span>${label}</span><strong>${esc(value)}</strong></article>`).join("");

        const cards = clientSummaries(this.ledger, this.clients);
        $("ledgerClients").innerHTML = [`<button type="button" class="client-card ${clientId ? "" : "active"}" data-ledger-client="">
                <strong>All clients</strong>
                <small>${formatZar(summarise(this.ledger).outstanding)} outstanding</small>
            </button>`].concat(cards.map((card) => `<button type="button" class="client-card ${card.client_id === clientId ? "active" : ""}" data-ledger-client="${esc(card.client_id)}">
                <strong>${esc(card.client_name)}</strong>
                <small>${formatZar(card.paid)} received · ${formatZar(card.outstanding)} due</small>
            </button>`)).join("");

        document.querySelectorAll("#payFilters [data-pay]").forEach((button) => {
            button.classList.toggle("active", button.dataset.pay === this.payFilter);
        });
        const selected = this.clients.find((client) => client.id === $("uploadClient").value);
        $("dropzoneTitle").textContent = selected ? `Upload invoices for ${selected.name}` : "Upload existing invoices";
        $("dropzoneHint").textContent = selected
            ? "Drop PDF or image files here, or choose several at once. Preview links expire after 2 minutes."
            : "Choose a client, then drop PDF or image files. They stay in a private bucket under that client.";

        const rows = this.filteredDocuments();
        if (!rows.length) {
            $("invoicesList").innerHTML = `<p class="empty-state">${this.ledger.length ? "Nothing matches those filters." : "No invoices or quotes yet."}</p>`;
            return;
        }
        $("invoicesList").innerHTML = rows.map((row) => this.ledgerCard(row)).join("");
    },

    ledgerCard(row) {
        const label = this.ledgerLabel(row);
        const late = isOverdue(row);
        const status = payStatus(row);
        const moneyRow = row.kind === "invoice" || row.source === "upload";
        const locked = row.status === "void" || row.status === "converted";
        const editable = !locked && moneyRow && (row.source === "upload" ? (this.uploadsReady && this.paidColumnReady) : this.ledgerReady);
        const total = invoiceTotal(row);
        const paid = displayedPaid(row);
        const balance = round2(Math.max(0, total - paid));
        const payLabel = status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid";
        const badges = [
            `<span class="status-tag ${row.source === "upload" ? "upload" : "source"}">${row.source === "upload" ? "Uploaded" : esc(row.kind)}</span>`,
            row.source === "app" ? `<span class="status-tag">${esc(STATUS_LABEL[row.status] || row.status)}</span>` : "",
            moneyRow && status ? `<span class="status-tag ${esc(status)}">${payLabel}</span>` : "",
            late ? `<span class="badge-overdue">Overdue</span>` : "",
        ].filter(Boolean).join("");
        const totalField = row.source === "upload"
            ? `<label class="ledger-amount">Invoice total
                <input class="form-input" type="text" inputmode="decimal" data-total-for="${esc(row.id)}" value="${esc(total.toFixed(2))}" ${editable ? "" : "disabled"}>
               </label>`
            : `<div class="ledger-amount">Invoice total<strong>${esc(formatZar(total))}</strong></div>`;
        const controls = moneyRow ? `
            ${totalField}
            <label class="ledger-amount">Amount paid
                <input class="form-input" type="text" inputmode="decimal" data-amount-for="${esc(row.id)}" data-source="${esc(row.source)}" value="${esc(paid.toFixed(2))}" ${editable ? "" : "disabled"} title="What the client has paid so far. You can change this any time.">
            </label>
            <div class="ledger-balance ${status === "paid" ? "settled" : ""}"><span>Outstanding</span><strong>${esc(formatZar(balance))}</strong></div>
            ${editable ? `<button type="button" class="pay-toggle ${status === "paid" ? "is-paid" : "is-unpaid"}" data-toggle-paid="${esc(row.id)}" data-source="${esc(row.source)}" aria-pressed="${status === "paid" ? "true" : "false"}">${status === "paid" ? "Paid" : "Unpaid"}</button>` : ""}
        ` : "";
        const actions = row.source === "upload"
            ? `${canPreview(row.mime_type) ? `<button type="button" class="btn btn-secondary btn-sm" data-preview-upload="${esc(row.id)}">Preview</button>` : ""}
               <button type="button" class="btn btn-secondary btn-sm" data-download-upload="${esc(row.id)}">Download</button>
               <button type="button" class="btn btn-danger btn-sm" data-delete-upload="${esc(row.id)}">Delete</button>`
            : `<button type="button" class="btn btn-secondary btn-sm" data-open="${esc(row.id)}">Open</button>`;
        const meta = row.source === "upload"
            ? `${formatBytes(row.size_bytes)} · ${esc(row.issue_date || "no date")}`
            : esc(row.issue_date || "no date");
        return `<article class="ledger-card">
            <div class="ledger-card-top">
                <div>
                    <h4>${esc(label)} · ${esc(row.client_name)}</h4>
                    <p>${meta}</p>
                </div>
                <div class="ledger-badges">${badges}</div>
            </div>
            <div class="ledger-figures">${controls}</div>
            <div class="ledger-card-controls"><div class="saved-item-actions">${actions}</div></div>
            ${this.historyHtml(row)}
        </article>`;
    },

    historyHtml(row) {
        const events = (this.paidEvents || []).filter((event) => (
            row.source === "upload" ? event.upload_id === row.id : event.invoice_id === row.id
        )).slice(0, 3);
        if (!events.length) return "";
        const lines = events.map((event) => {
            const when = String(event.created_at || "").slice(0, 10);
            if (event.kind === "marked_paid") return `${when} · marked fully paid`;
            if (event.kind === "marked_unpaid") return `${when} · paid flag cleared · ${formatZar(event.amount)} still entered`;
            return `${when} · amount paid ${formatZar(event.amount)}`;
        });
        return `<p class="paid-history">${lines.map((line) => esc(line)).join(" · ")}</p>`;
    },

    exportCsv() {
        const rows = this.filteredDocuments();
        if (!rows.length) {
            this.showBanner("There are no rows to export for the current filters.", "error");
            return;
        }
        const header = ["type", "reference", "number", "document_status", "pay_status", "client", "issue_date", "due_date", "invoice_total", "amount_paid", "outstanding", "overdue"];
        const body = rows.map((row) => {
            const total = invoiceTotal(row);
            const paid = displayedPaid(row);
            return [
                row.source === "upload" ? "upload" : row.kind,
                row.reference || "",
                row.number || "",
                row.status,
                payStatus(row),
                row.client_name || "",
                row.issue_date || "",
                row.due_date || "",
                total,
                paid,
                round2(Math.max(0, total - paid)),
                isOverdue(row) ? "yes" : "no",
            ];
        });
        const csv = [header, ...body].map((line) => line.map((cell) => {
            const text = String(cell ?? "");
            return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        }).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dubani-documents-${saToday()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        this.showBanner(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}.`, "ok");
    },

    renderClients() {
        const query = $("searchClientsInput").value.trim().toLowerCase();
        const rows = this.clients.filter((client) => {
            const hay = `${client.name} ${client.email || ""} ${client.phone || ""}`.toLowerCase();
            return !query || hay.includes(query);
        });
        if (!rows.length) {
            $("clientsList").innerHTML = `<p class="empty-state">No clients yet.</p>`;
            return;
        }
        $("clientsList").innerHTML = rows.map((client) => `
            <div class="saved-item">
                <div class="saved-item-info">
                    <h4>${esc(client.name)}${client.archived ? " · archived" : ""}</h4>
                    <p>${esc(client.email || "")} ${esc(client.phone || "")}</p>
                </div>
                <div class="saved-item-actions">
                    <button type="button" class="btn btn-secondary btn-sm" data-client-invoices="${esc(client.id)}">Invoices</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-edit-client="${esc(client.id)}">Edit</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-archive-client="${esc(client.id)}">${client.archived ? "Restore" : "Archive"}</button>
                </div>
            </div>`).join("");
    },

    renderServices() {
        if (!this.services.length) {
            $("servicesList").innerHTML = `<p class="empty-state">No services yet. Add one to use it on line items.</p>`;
            return;
        }
        $("servicesList").innerHTML = this.services.map((service) => `
            <div class="saved-item">
                <div class="saved-item-info">
                    <h4>${esc(service.name)}</h4>
                    <p>${money(service.unit_price)}</p>
                </div>
                <div class="saved-item-actions">
                    <button type="button" class="btn btn-danger btn-sm" data-archive-service="${esc(service.id)}">Archive</button>
                </div>
            </div>`).join("");
    },

    fillSettingsForm() {
        const settings = this.settings;
        $("settTrading").value = settings.trading_name || "";
        $("settLegal").value = settings.legal_name || "";
        $("settAddress").value = settings.address || "";
        $("settCity").value = settings.city || "";
        $("settCountry").value = settings.country || "";
        $("settEmail").value = settings.email || "";
        $("settPhone").value = settings.phone || "";
        $("settWebsite").value = settings.website || "";
        $("settReg").value = settings.company_reg_number || "";
        $("settTax").value = settings.tax_number || "";
        $("settVatNo").value = settings.vat_number || "";
        $("settVatRegistered").value = settings.vat_registered ? "true" : "false";
        $("settBank").value = settings.bank_name || "";
        $("settHolder").value = settings.account_holder || "";
        $("settAccount").value = settings.account_number || "";
        $("settBranch").value = settings.branch_code || "";
        $("settAccountType").value = settings.account_type || "";
        $("settPay").value = settings.payment_instructions || "";
        $("settTermsShort").value = settings.payment_terms || "";
        $("settTerms").value = settings.terms_and_conditions || "";
        $("settDueDays").value = settings.default_due_days ?? 7;
    },

    async saveSettings(event) {
        event.preventDefault();
        const blank = (id) => $(id).value.trim() || null;
        const payload = {
            trading_name: $("settTrading").value.trim() || "Dubani Creatives",
            legal_name: blank("settLegal"),
            address: blank("settAddress"),
            city: blank("settCity"),
            country: $("settCountry").value.trim() || "South Africa",
            email: blank("settEmail"),
            phone: blank("settPhone"),
            website: blank("settWebsite"),
            company_reg_number: blank("settReg"),
            tax_number: blank("settTax"),
            vat_number: blank("settVatNo"),
            vat_registered: $("settVatRegistered").value === "true",
            bank_name: blank("settBank"),
            account_holder: blank("settHolder"),
            account_number: blank("settAccount"),
            branch_code: blank("settBranch"),
            account_type: blank("settAccountType"),
            payment_instructions: blank("settPay"),
            payment_terms: blank("settTermsShort"),
            terms_and_conditions: blank("settTerms"),
            default_due_days: Math.min(120, Math.max(0, Number($("settDueDays").value) || 0)),
        };
        const { data, error } = await supabase.from("business_settings").update(payload).eq("owner_id", this.session.user.id).select("*").single();
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        this.settings = data;
        this.hideModal("settingsModal");
        this.render();
        this.showBanner("Business settings saved.", "ok");
    },

    showModal(id) { $(id).classList.add("active"); },
    hideModal(id) { $(id).classList.remove("active"); },

    async openPayments() {
        if (!this.state.id || this.state.kind !== "invoice" || this.state.status === "draft") {
            this.showBanner("Issue the invoice before recording a payment.", "error");
            return;
        }
        $("payDate").value = saToday();
        $("payAmount").value = this.balance() > 0 ? this.balance().toFixed(2) : "";
        $("payReference").value = "";
        $("payNote").value = "";
        this.renderPaymentHistory();
        $("paymentForm").hidden = this.balance() <= 0 || ["void", "draft"].includes(this.state.status);
        this.showModal("paymentModal");
    },

    renderPaymentHistory() {
        if (!this.payments.length) {
            $("payHistory").innerHTML = `<p class="empty-state">No payments yet.</p>`;
            return;
        }
        $("payHistory").innerHTML = this.payments.map((payment) => `
            <article>
                <span>${esc(payment.paid_on)} · ${esc(payment.method)} · ${money(payment.amount)}${payment.reference ? " · " + esc(payment.reference) : ""}</span>
                <button type="button" class="btn btn-danger btn-sm" data-delete-payment="${esc(payment.id)}">Delete</button>
            </article>`).join("");
    },

    async savePayment(event) {
        event.preventDefault();
        const amount = Number($("payAmount").value);
        const { error } = await supabase.from("payments").insert({
            invoice_id: this.state.id,
            amount,
            paid_on: $("payDate").value,
            method: $("payMethod").value,
            reference: $("payReference").value.trim() || null,
            note: $("payNote").value.trim() || null,
        });
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        this.hideModal("paymentModal");
        await this.openDocument(this.state.id);
        this.showBanner("Payment recorded. The balance was updated by the database.", "ok");
    },

    async deletePayment(id) {
        if (!window.confirm("Delete this payment? The invoice balance will be recalculated.")) return;
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        await this.openDocument(this.state.id);
        this.renderPaymentHistory();
        $("paymentForm").hidden = this.balance() <= 0;
        this.showBanner("Payment deleted.", "ok");
    },

    buildPdf() {
        const JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!JsPDF) throw new Error("jsPDF did not load. Check your connection and refresh.");
        const doc = new JsPDF({ unit: "mm", format: "a4" });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 20;
        const right = pageW - margin;
        const state = this.state;
        const logoTop = 12;
        const logoHeight = 12;
        const logoRatio = this.logoSize.height ? this.logoSize.width / this.logoSize.height : (2248 / 337);
        const logoWidth = Math.round(logoHeight * logoRatio * 10) / 10;
        let drewLogo = false;
        if (typeof this.logoBase64 === "string" && this.logoBase64.startsWith("data:image/")) {
            try {
                const format = this.logoBase64.includes("image/jpeg") ? "JPEG" : "PNG";
                doc.addImage(this.logoBase64, format, margin, logoTop, logoWidth, logoHeight);
                drewLogo = true;
            } catch {
                drewLogo = false;
            }
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(state.kind === "quote" ? "QUOTE" : "INVOICE", right, 18, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(120);
        const number = this.displayReference();
        if (number) doc.text(number, right, 26, { align: "right" });
        doc.setTextColor(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        let y = drewLogo ? logoTop + logoHeight + 8 : 22;
        const lines = this.companyLines();
        doc.text(lines[0] || "Dubani Creatives", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80);
        y += 6;
        lines.slice(1).forEach((line) => {
            doc.text(String(line), margin, y);
            y += 4;
        });
        y += 4;
        doc.setDrawColor(30);
        doc.line(margin, y, right, y);
        y += 8;
        doc.setTextColor(120);
        doc.text("Date", right - 45, y);
        doc.setTextColor(30);
        doc.text(state.issueDate || "—", right, y, { align: "right" });
        y += 5;
        doc.setTextColor(120);
        doc.text("Due", right - 45, y);
        doc.setTextColor(30);
        doc.text(state.dueDate || "—", right, y, { align: "right" });
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.text("Bill to", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        [state.client.name, state.client.phone, state.client.email, state.client.address].filter(Boolean).forEach((line) => {
            doc.text(String(line), margin, y);
            y += 4;
        });
        y += 4;
        const body = state.items.filter((item) => item.title).map((item) => [
            item.description ? `${item.title}\n${item.description}` : item.title,
            String(item.quantity),
            money(item.unitPrice),
            money(this.lineTotal(item)),
        ]);
        doc.autoTable({
            startY: y,
            head: [["Item", "Qty", "Rate", "Amount"]],
            body: body.length ? body : [["No items", "", "", ""]],
            theme: "grid",
            styles: { fontSize: 9, textColor: 30 },
            headStyles: { fillColor: [255, 94, 0], textColor: 255 },
            margin: { left: margin, right: margin },
        });
        y = doc.lastAutoTable.finalY + 8;
        const totals = [
            ["Subtotal", money(this.subtotal())],
            ["Discount", "- " + money(this.discountAmount())],
            ["VAT", money(this.vatAmount())],
            ["Total", money(this.total())],
            ["Paid", "- " + money(this.state.amountPaid)],
            ["Balance due", money(this.balance())],
        ];
        totals.forEach(([label, value]) => {
            doc.text(label, right - 50, y);
            doc.text(value, right, y, { align: "right" });
            y += 5;
        });
        y += 4;
        const notes = [state.notes, state.paymentInstructions, this.paymentBlock(), this.settings.payment_terms, this.settings.terms_and_conditions]
            .filter(Boolean).join("\n\n");
        if (notes) {
            const wrapped = doc.splitTextToSize(notes, pageW - margin * 2);
            doc.setFontSize(8);
            doc.setTextColor(90);
            doc.text(wrapped, margin, y);
        }
        if (state.status === "paid" || state.status === "partially_paid" || state.status === "void") {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(state.status === "void" ? 48 : 36);
            doc.setTextColor(state.status === "paid" ? 37 : state.status === "void" ? 200 : 255, state.status === "paid" ? 160 : 80, state.status === "void" ? 60 : 0);
            const stamp = state.status === "paid" ? "PAID" : state.status === "void" ? "VOID" : "PARTIALLY PAID";
            doc.text(stamp, pageW / 2, 150, { align: "center", angle: 25 });
        }
        return doc;
    },

    fileName() {
        const who = (this.state.client.name || "client").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
        const ref = this.displayReference() || "draft";
        return `${ref}-${who || "client"}.pdf`;
    },

    async downloadPdf() {
        try {
            if (this.state.status === "draft") {
                const saved = await this.saveDraft(true);
                if (!saved) return;
            }
            const doc = this.buildPdf();
            doc.save(this.fileName());
            if (!this.state.reference) {
                this.showBanner("PDF downloaded. It is uploaded after the document is issued and has a number.", "ok");
                return;
            }
            const blob = doc.output("blob");
            const path = `${this.session.user.id}/${this.state.reference}.pdf`;
            const upload = await supabase.storage.from("invoices-pdf").upload(path, blob, {
                upsert: true,
                contentType: "application/pdf",
            });
            if (upload.error) {
                this.showBanner(`PDF downloaded, but upload failed: ${errText(upload.error)}`, "error");
                return;
            }
            const saved = await supabase.from("invoices").update({ pdf_path: path }).eq("id", this.state.id);
            if (saved.error) {
                this.showBanner(`PDF uploaded, but pdf_path was not saved: ${errText(saved.error)}`, "error");
                return;
            }
            this.showBanner("PDF downloaded and stored.", "ok");
        } catch (error) {
            this.showBanner(errText(error), "error");
        }
    },

    shareText() {
        const state = this.state;
        const lines = state.items.filter((item) => item.title)
            .map((item) => `• ${item.title} — ${money(this.lineTotal(item))}`);
        const bank = this.paymentBlock();
        return [
            `${state.kind === "quote" ? "Quote" : "Invoice"} ${this.displayReference() || "(draft)"}`,
            `For ${state.client.name || "client"}`,
            state.issueDate ? `Date: ${state.issueDate}` : "",
            state.dueDate ? `Due: ${state.dueDate}` : "",
            lines.join("\n"),
            `Total: ${money(this.total())}`,
            `Balance: ${money(this.balance())}`,
            bank ? `Payment details:\n${bank}` : "",
        ].filter(Boolean).join("\n");
    },

    showShare(label, href) {
        $("shareLinks").innerHTML = `${esc(label)}: <a href="${esc(href)}" target="_blank" rel="noopener">${esc(href)}</a>`;
        window.open(href, "_blank", "noopener");
    },

    shareWhatsApp() {
        this.readForm();
        const phone = (this.state.client.phone || "").replace(/[^\d]/g, "");
        const text = encodeURIComponent(this.shareText());
        const href = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
        this.showShare("WhatsApp", href);
    },

    shareEmail() {
        this.readForm();
        const subject = encodeURIComponent(`${this.state.kind === "quote" ? "Quote" : "Invoice"} ${this.displayReference() || "draft"}`);
        const href = `mailto:${encodeURIComponent(this.state.client.email || "")}?subject=${subject}&body=${encodeURIComponent(this.shareText())}`;
        this.showShare("Email", href);
    },

    bindStaticEvents() {
        const refresh = () => {
            if (this.state.status !== "draft") return;
            this.readForm();
            this.paintTotals();
            this.updatePreview();
        };
        ["docTitle", "invoiceDate", "dueDate", "clientName", "clientEmail", "clientPhone", "clientAddress", "discount", "invoiceNotes", "paymentInstructions"]
            .forEach((id) => $(id).addEventListener("input", refresh));
        $("vatEnabled").addEventListener("change", refresh);
        $("discountType").addEventListener("change", refresh);
        $("docKind").addEventListener("change", async () => {
            if (this.state.id) return;
            this.readForm();
            this.state.kind = $("docKind").value;
            this.state.nextRef = await this.peekNext(this.state.kind);
            this.render();
        });
        $("clientSelect").addEventListener("change", () => {
            const client = this.clients.find((row) => row.id === $("clientSelect").value);
            if (client) this.applyClient(client);
        });
        $("clientName").addEventListener("change", () => {
            const name = $("clientName").value.trim().toLowerCase();
            const client = this.clients.find((row) => row.name.trim().toLowerCase() === name && !row.archived);
            if (client) this.applyClient(client);
            else {
                this.state.clientId = null;
                refresh();
            }
        });
        $("itemsBody").addEventListener("input", (event) => {
            const row = event.target.closest("tr");
            if (!row || this.state.status !== "draft") return;
            const item = this.state.items[Number(row.dataset.idx)];
            if (event.target.classList.contains("item-title")) item.title = event.target.value;
            if (event.target.classList.contains("item-desc")) item.description = event.target.value;
            if (event.target.classList.contains("item-qty")) item.quantity = Number(event.target.value);
            if (event.target.classList.contains("item-rate")) item.unitPrice = Number(event.target.value);
            row.querySelector(".line-total").textContent = money(this.lineTotal(item));
            this.paintTotals();
            this.updatePreview();
        });
        $("itemsBody").addEventListener("change", (event) => {
            if (!event.target.classList.contains("item-service")) return;
            const row = event.target.closest("tr");
            const item = this.state.items[Number(row.dataset.idx)];
            const service = this.services.find((entry) => entry.id === event.target.value);
            item.serviceId = event.target.value;
            if (service) {
                item.title = service.name;
                item.unitPrice = Number(service.unit_price) || 0;
                if (!item.description && service.description) item.description = service.description;
                this.renderItems();
                this.updatePreview();
            }
        });
        $("itemsBody").addEventListener("click", (event) => {
            const button = event.target.closest(".remove-item");
            if (!button || this.state.status !== "draft") return;
            const index = Number(button.closest("tr").dataset.idx);
            if (this.state.items.length === 1) {
                this.state.items[0] = { serviceId: "", title: "", description: "", quantity: 1, unitPrice: 0 };
            } else {
                this.state.items.splice(index, 1);
            }
            this.renderItems();
            this.updatePreview();
        });
        $("addItemBtn").addEventListener("click", () => {
            this.readForm();
            this.state.items.push({ serviceId: "", title: "", description: "", quantity: 1, unitPrice: 0 });
            this.renderItems();
        });
        $("saveClientBtn").addEventListener("click", async () => {
            try {
                await this.ensureClient();
                this.showBanner("Client saved.", "ok");
            } catch (error) {
                this.showBanner(errText(error), "error");
            }
        });
        $("saveInvoiceBtn").addEventListener("click", () => this.saveDraft(false));
        $("finaliseBtn").addEventListener("click", () => this.finalise());
        $("duplicateBtn").addEventListener("click", () => this.duplicate());
        $("convertBtn").addEventListener("click", () => this.convertQuote());
        $("acceptBtn").addEventListener("click", () => this.setStatus("accepted"));
        $("declineBtn").addEventListener("click", () => this.setStatus("declined"));
        $("voidBtn").addEventListener("click", () => this.voidDocument());
        $("deleteDraftBtn").addEventListener("click", () => this.deleteDraft());
        $("newInvoiceBtn").addEventListener("click", () => this.newDocument());
        $("downloadPdf").addEventListener("click", () => this.downloadPdf());
        $("shareWhatsapp").addEventListener("click", () => this.shareWhatsApp());
        $("shareEmail").addEventListener("click", () => this.shareEmail());
        $("markPaidBtn").addEventListener("click", () => this.openPayments());
        $("paymentForm").addEventListener("submit", (event) => this.savePayment(event));
        $("payHistory").addEventListener("click", (event) => {
            const button = event.target.closest("[data-delete-payment]");
            if (button) this.deletePayment(button.dataset.deletePayment);
        });
        $("manageInvoicesBtn").addEventListener("click", () => this.openLedger($("filterClient").value));
        ["searchInvoicesInput", "filterKind", "filterStatus", "filterClient", "filterFrom", "filterTo"].forEach((id) => {
            $(id).addEventListener("input", () => {
                if (id === "filterClient" && $("filterClient").value) $("uploadClient").value = $("filterClient").value;
                this.renderDocumentList();
            });
        });
        $("uploadClient").addEventListener("change", () => {
            $("filterClient").value = $("uploadClient").value;
            this.renderDocumentList();
        });
        $("ledgerClients").addEventListener("click", (event) => {
            const card = event.target.closest("[data-ledger-client]");
            if (!card) return;
            const id = card.dataset.ledgerClient;
            $("filterClient").value = id;
            if (id) $("uploadClient").value = id;
            this.renderDocumentList();
        });
        $("invoicesList").addEventListener("click", (event) => this.onLedgerClick(event));
        $("invoicesList").addEventListener("change", (event) => {
            const paid = event.target.closest("[data-amount-for]");
            if (paid) this.saveAmountPaid(paid.dataset.amountFor, paid.dataset.source, paid.value);
            const total = event.target.closest("[data-total-for]");
            if (total) this.saveUploadTotal(total.dataset.totalFor, total.value);
        });
        $("payFilters").addEventListener("click", (event) => {
            const button = event.target.closest("[data-pay]");
            if (!button) return;
            this.payFilter = button.dataset.pay;
            this.renderDocumentList();
        });
        $("browseInvoicesBtn").addEventListener("click", () => $("invoiceFileInput").click());
        $("invoiceFileInput").addEventListener("change", () => {
            this.enqueueUploads($("invoiceFileInput").files);
            $("invoiceFileInput").value = "";
        });
        const zone = $("invoiceDropzone");
        ["dragenter", "dragover"].forEach((name) => {
            zone.addEventListener(name, (event) => {
                event.preventDefault();
                zone.classList.add("dragover");
            });
        });
        zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
        zone.addEventListener("drop", (event) => {
            event.preventDefault();
            zone.classList.remove("dragover");
            this.enqueueUploads(event.dataTransfer?.files);
        });
        $("exportCsvBtn").addEventListener("click", () => this.exportCsv());
        $("manageClientsBtn").addEventListener("click", () => {
            this.renderClients();
            this.showModal("clientsModal");
        });
        $("searchClientsInput").addEventListener("input", () => this.renderClients());
        $("addClientForm").addEventListener("submit", (event) => this.submitClient(event));
        $("clientsList").addEventListener("click", (event) => this.onClientListClick(event));
        $("manageServicesBtn").addEventListener("click", () => {
            this.renderServices();
            this.showModal("servicesModal");
        });
        $("addServiceForm").addEventListener("submit", (event) => this.submitService(event));
        $("servicesList").addEventListener("click", async (event) => {
            const button = event.target.closest("[data-archive-service]");
            if (!button) return;
            const { error } = await supabase.from("services").update({ active: false }).eq("id", button.dataset.archiveService);
            if (error) {
                this.showBanner(errText(error), "error");
                return;
            }
            this.services = this.services.filter((service) => service.id !== button.dataset.archiveService);
            this.renderServices();
            this.renderItems();
            this.showBanner("Service archived.", "ok");
        });
        $("settingsBtn").addEventListener("click", () => {
            this.fillSettingsForm();
            this.showModal("settingsModal");
        });
        $("settingsForm").addEventListener("submit", (event) => this.saveSettings(event));
        document.querySelectorAll(".modal-close").forEach((button) => {
            button.addEventListener("click", () => button.closest(".modal-overlay").classList.remove("active"));
        });
        document.querySelectorAll(".modal-overlay").forEach((overlay) => {
            overlay.addEventListener("click", (event) => {
                if (event.target === overlay) overlay.classList.remove("active");
            });
        });
        $("uploadPreviewModal").addEventListener("click", (event) => {
            if (event.target === $("uploadPreviewModal") || event.target.closest(".modal-close")) {
                $("uploadPreviewFrame").hidden = true;
                $("uploadPreviewFrame").src = "about:blank";
                $("uploadPreviewImage").hidden = true;
                $("uploadPreviewImage").removeAttribute("src");
            }
        });
        window.addEventListener("dragover", (event) => {
            if ($("invoicesModal").classList.contains("active")) event.preventDefault();
        });
        window.addEventListener("drop", (event) => {
            if (!$("invoicesModal").classList.contains("active")) return;
            if (event.target.closest("#invoiceDropzone")) return;
            event.preventDefault();
        });
    },

    findLedgerEntry(id, source) {
        return this.ledger.find((row) => row.id === id && row.source === source);
    },

    async saveAmountPaid(id, source, raw) {
        const entry = this.findLedgerEntry(id, source);
        if (!entry) return;
        const parsed = parseAmount(raw, true);
        if (!parsed.ok) {
            this.showBanner(parsed.error, "error");
            this.renderDocumentList();
            return;
        }
        const amount = parsed.amount == null ? 0 : parsed.amount;
        const before = displayedPaid(entry);
        if (amount === before && !entry.forced_paid) return;
        const patch = source === "upload"
            ? { amount_paid: amount, paid: false }
            : { tracked_amount: amount, marked_paid: false };
        const { error } = await supabase.from(source === "upload" ? "invoice_uploads" : "invoices").update(patch).eq("id", id);
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        await this.logPaidEvent(entry, amount, round2(amount - before), "edit");
        this.showBanner("Amount paid saved.", "ok");
        await this.loadDocuments();
    },

    async saveUploadTotal(id, raw) {
        const entry = this.findLedgerEntry(id, "upload");
        if (!entry) return;
        const parsed = parseAmount(raw, false);
        if (!parsed.ok) {
            this.showBanner(parsed.error || "Enter the invoice total.", "error");
            this.renderDocumentList();
            return;
        }
        const { error } = await supabase.from("invoice_uploads").update({ amount: parsed.amount }).eq("id", id);
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        this.showBanner("Invoice total saved.", "ok");
        await this.loadDocuments();
    },

    async toggleLedgerPaid(id, source) {
        const entry = this.findLedgerEntry(id, source);
        if (!entry) return;
        const plan = togglePlan(entry);
        if (plan.action === "already") {
            this.showBanner("Amount paid already covers this invoice. Change the amount if a balance is still due.", "ok");
            return;
        }
        if (plan.action === "force" && plan.confirm) {
            const ok = window.confirm(`Mark the full ${formatZar(invoiceTotal(entry))} as paid? The ${formatZar(entry.entered_paid)} already entered stays saved if you switch this back to unpaid.`);
            if (!ok) return;
        }
        const forced = plan.action === "force";
        const patch = source === "upload"
            ? { paid: forced }
            : { marked_paid: forced };
        const { error } = await supabase.from(source === "upload" ? "invoice_uploads" : "invoices").update(patch).eq("id", id);
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        const shown = forced ? invoiceTotal(entry) : entry.entered_paid;
        const before = displayedPaid(entry);
        await this.logPaidEvent(entry, shown, round2(shown - before), forced ? "marked_paid" : "marked_unpaid");
        this.showBanner(forced ? "Marked paid." : `Marked unpaid. Amount paid is still ${formatZar(entry.entered_paid)}.`, "ok");
        await this.loadDocuments();
    },

    async logPaidEvent(entry, amount, delta, kind) {
        const row = {
            amount,
            delta,
            kind,
            invoice_id: entry.source === "app" ? entry.id : null,
            upload_id: entry.source === "upload" ? entry.id : null,
        };
        const { error } = await supabase.from("invoice_paid_events").insert(row);
        if (error && !missingPaidEvents(error)) this.showBanner(errText(error), "error");
    },

    async onLedgerClick(event) {
        const open = event.target.closest("[data-open]");
        if (open) {
            this.hideModal("invoicesModal");
            await this.openDocument(open.dataset.open);
            return;
        }
        const toggle = event.target.closest("[data-toggle-paid]");
        if (toggle) {
            await this.toggleLedgerPaid(toggle.dataset.togglePaid, toggle.dataset.source);
            return;
        }
        const preview = event.target.closest("[data-preview-upload]");
        if (preview) {
            await this.previewUpload(preview.dataset.previewUpload);
            return;
        }
        const download = event.target.closest("[data-download-upload]");
        if (download) {
            await this.downloadUpload(download.dataset.downloadUpload);
            return;
        }
        const remove = event.target.closest("[data-delete-upload]");
        if (remove) await this.deleteUpload(remove.dataset.deleteUpload);
    },

    async signedUploadUrl(path) {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
        if (error) throw error;
        return data.signedUrl;
    },

    async previewUpload(id) {
        const entry = this.findLedgerEntry(id, "upload");
        if (!entry) return;
        try {
            const url = await this.signedUploadUrl(entry.storage_path);
            $("uploadPreviewTitle").textContent = entry.name;
            const frame = $("uploadPreviewFrame");
            const image = $("uploadPreviewImage");
            if (isPdf(entry.mime_type)) {
                image.hidden = true;
                image.removeAttribute("src");
                frame.hidden = false;
                frame.src = url;
            } else {
                frame.hidden = true;
                frame.src = "about:blank";
                image.hidden = false;
                image.alt = entry.name;
                image.src = url;
            }
            this.showModal("uploadPreviewModal");
        } catch (error) {
            this.showBanner(errText(error), "error");
        }
    },

    async downloadUpload(id) {
        const entry = this.findLedgerEntry(id, "upload");
        if (!entry) return;
        try {
            const url = await this.signedUploadUrl(entry.storage_path);
            const response = await fetch(url);
            if (!response.ok) throw new Error("Download failed.");
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = entry.name;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        } catch (error) {
            this.showBanner(errText(error), "error");
        }
    },

    async deleteUpload(id) {
        const entry = this.findLedgerEntry(id, "upload");
        if (!entry) return;
        if (!window.confirm(`Delete ${entry.name}? The file is removed from this client.`)) return;
        const { error } = await supabase.from("invoice_uploads").delete().eq("id", id);
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        const removed = await supabase.storage.from(BUCKET).remove([entry.storage_path]);
        if (removed.error) {
            this.showBanner(`The invoice was removed from the list, but the file is still stored: ${errText(removed.error)}`, "error");
        } else {
            this.showBanner("Uploaded invoice deleted.", "ok");
        }
        await this.loadDocuments();
    },

    enqueueUploads(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        if (!this.uploadsReady) {
            this.showBanner("Apply supabase/migrations/20261113143000_invoice_uploads.sql before uploading.", "error");
            return;
        }
        if (!$("uploadClient").value) {
            this.showBanner("Choose a client before uploading invoices.", "error");
            return;
        }
        files.forEach((file) => this.uploadQueue.push(file));
        this.pumpUploads();
    },

    uploadObject(path, file, mime, token, onProgress) {
        return new Promise((resolve, reject) => {
            const typed = new File([file], file.name, { type: mime });
            const body = new FormData();
            body.append("cacheControl", "3600");
            body.append("", typed);
            const xhr = new XMLHttpRequest();
            const encoded = path.split("/").map((part) => encodeURIComponent(part)).join("/");
            xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.setRequestHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
            xhr.setRequestHeader("x-upsert", "false");
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) onProgress(event.loaded / event.total);
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress(1);
                    resolve();
                    return;
                }
                let message = xhr.status ? `Upload failed (${xhr.status}).` : "Upload failed.";
                try {
                    const parsed = JSON.parse(xhr.responseText);
                    message = parsed.message || parsed.error || parsed.msg || message;
                } catch { /* keep the status message */ }
                reject(new Error(message));
            };
            xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
            xhr.send(body);
        });
    },

    queueRow(name) {
        const row = document.createElement("li");
        row.className = "upload-row";
        row.innerHTML = `<header><span></span><strong>Waiting…</strong></header><div class="progress"><span></span></div>`;
        row.querySelector("header span").textContent = name;
        const strong = row.querySelector("header strong");
        const fill = row.querySelector(".progress span");
        $("invoiceUploadQueue").prepend(row);
        return {
            progress(ratio) {
                fill.style.width = `${Math.round(ratio * 100)}%`;
                strong.textContent = `${Math.round(ratio * 100)}%`;
            },
            fail(message) {
                row.classList.add("error");
                strong.textContent = message;
            },
            done() {
                strong.textContent = "Uploaded";
                fill.style.width = "100%";
            },
        };
    },

    async uploadOne(file) {
        const checked = inspectUpload(file);
        const row = this.queueRow(file.name || "File");
        if (!checked.ok) {
            row.fail(checked.error);
            return false;
        }
        const clientId = $("uploadClient").value;
        const fileId = crypto.randomUUID();
        const path = storagePath(this.session.user.id, clientId, fileId, checked.name);
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) throw new Error("Your session expired. Sign in again.");
            row.progress(0);
            await this.uploadObject(path, file, checked.mime, data.session.access_token, row.progress);
            const inserted = await supabase.from("invoice_uploads").insert({
                id: fileId,
                client_id: clientId,
                name: checked.name,
                storage_path: path,
                mime_type: checked.mime,
                size_bytes: checked.size,
                amount: 0,
                paid: false,
                issue_date: saToday(),
            });
            if (inserted.error) {
                await supabase.storage.from(BUCKET).remove([path]);
                throw inserted.error;
            }
            row.done();
            return true;
        } catch (error) {
            row.fail(errText(error));
            return false;
        }
    },

    async pumpUploads() {
        if (this.uploading) return;
        this.uploading = true;
        let ok = 0;
        let failed = 0;
        while (this.uploadQueue.length) {
            const file = this.uploadQueue.shift();
            if (await this.uploadOne(file)) ok += 1;
            else failed += 1;
        }
        this.uploading = false;
        if (ok) {
            $("filterClient").value = $("uploadClient").value;
            await this.loadDocuments();
        }
        if (ok || failed) {
            this.showBanner(`Uploaded ${ok} file${ok === 1 ? "" : "s"}${failed ? `. ${failed} failed.` : "."}`, failed ? "error" : "ok");
        }
    },

    async submitClient(event) {
        event.preventDefault();
        const id = $("editClientId").value;
        const payload = {
            name: $("newClientName").value.trim(),
            contact_person: $("newClientContact").value.trim() || null,
            email: $("newClientEmail").value.trim() || null,
            phone: $("newClientPhone").value.trim() || null,
            address: $("newClientAddress").value.trim() || null,
            industry: $("newClientIndustry").value.trim() || null,
            vat_number: $("newClientVat").value.trim() || null,
            payment_terms_days: Math.min(120, Math.max(0, Number($("newClientTerms").value) || 0)),
            status: $("newClientStatus").value,
            notes: $("newClientNotes").value.trim() || null,
        };
        const query = id
            ? supabase.from("clients").update(payload).eq("id", id)
            : supabase.from("clients").insert(payload);
        const { data, error } = await query.select("*").single();
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        const index = this.clients.findIndex((client) => client.id === data.id);
        if (index >= 0) this.clients[index] = data;
        else this.clients.push(data);
        this.clients.sort((a, b) => a.name.localeCompare(b.name));
        this.fillClientPickers();
        $("addClientForm").reset();
        $("editClientId").value = "";
        $("clientFormTitle").textContent = "Add client";
        $("clientFormSubmit").textContent = "Add client";
        this.renderClients();
        this.showBanner(id ? "Client updated." : "Client added.", "ok");
    },

    async onClientListClick(event) {
        const invoices = event.target.closest("[data-client-invoices]");
        if (invoices) {
            this.hideModal("clientsModal");
            await this.openLedger(invoices.dataset.clientInvoices);
            return;
        }
        const edit = event.target.closest("[data-edit-client]");
        const archive = event.target.closest("[data-archive-client]");
        if (edit) {
            const client = this.clients.find((row) => row.id === edit.dataset.editClient);
            if (!client) return;
            $("editClientId").value = client.id;
            $("newClientName").value = client.name || "";
            $("newClientContact").value = client.contact_person || "";
            $("newClientEmail").value = client.email || "";
            $("newClientPhone").value = client.phone || "";
            $("newClientAddress").value = client.address || "";
            $("newClientIndustry").value = client.industry || "";
            $("newClientVat").value = client.vat_number || "";
            $("newClientTerms").value = client.payment_terms_days ?? 7;
            $("newClientStatus").value = client.status || "active";
            $("newClientNotes").value = client.notes || "";
            $("clientFormTitle").textContent = "Edit client";
            $("clientFormSubmit").textContent = "Save client";
        }
        if (archive) {
            const client = this.clients.find((row) => row.id === archive.dataset.archiveClient);
            const { data, error } = await supabase.from("clients").update({ archived: !client.archived }).eq("id", client.id).select("*").single();
            if (error) {
                this.showBanner(errText(error), "error");
                return;
            }
            Object.assign(client, data);
            this.fillClientPickers();
            this.renderClients();
            this.showBanner(data.archived ? "Client archived." : "Client restored.", "ok");
        }
    },

    async submitService(event) {
        event.preventDefault();
        const name = $("newServiceName").value.trim();
        const price = Number($("newServicePrice").value) || 0;
        const { data, error } = await supabase.from("services").insert({
            name,
            unit_price: price < 0 ? 0 : price,
            description: $("newServiceDescription").value.trim() || null,
        }).select("*").single();
        if (error) {
            this.showBanner(errText(error), "error");
            return;
        }
        this.services.push(data);
        $("addServiceForm").reset();
        this.renderServices();
        this.renderItems();
        this.showBanner("Service added.", "ok");
    },
};

App.init();
