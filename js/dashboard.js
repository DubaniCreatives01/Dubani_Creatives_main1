import { supabase } from "./supabase-client.js";
import { requireOwner } from "./auth-guard.js";
import { displayDate } from "./vault-logic.mjs";
import {
    entryFromApp,
    entryFromUpload,
    summarise,
    splitAmount,
    displayedPaid,
    invoiceTotal,
    payStatus,
    monthReceived,
    isOverdueEntry,
    missingLedgerColumn,
    missingUploadsTable,
    missingPaidEvents,
} from "./invoice-ledger.mjs";

const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

function saToday() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Johannesburg",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function errText(error) {
    if (!error) return "Request failed.";
    return [error.message, error.details, error.hint].filter(Boolean).join(" — ");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function greeting(date = new Date()) {
    const hour = Number(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Johannesburg",
        hour: "numeric",
        hourCycle: "h23",
    }).format(date));
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

const session = await requireOwner();
if (session) {
    const greet = document.getElementById("dash-greeting");
    if (greet) greet.textContent = greeting();
    const emailEl = document.getElementById("signed-in-email");
    if (emailEl) emailEl.textContent = session.user.email || "Signed in";
    const statusEl = document.getElementById("dash-status");

    loadRecentUploads();

    const setup = await supabase.rpc("ensure_owner_setup");
    if (setup.error) {
        statusEl.hidden = false;
        statusEl.textContent = errText(setup.error);
    } else {
        await loadStats();
    }

    document.getElementById("logout-btn").addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            statusEl.hidden = false;
            statusEl.textContent = errText(error);
            return;
        }
        location.href = "login.html";
    });

    document.getElementById("import-legacy-btn").addEventListener("click", () => {
        importBrowserData();
    });
}

async function loadRecentUploads() {
    const host = document.getElementById("vault-recent");
    if (!host) return;
    const [fileRes, folderRes] = await Promise.all([
        supabase
            .from("vault_files")
            .select("id, name, folder_id, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        supabase.from("vault_folders").select("id, name"),
    ]);
    const error = fileRes.error || folderRes.error;
    if (error) {
        const text = errText(error);
        const missing = error.code === "PGRST205" || error.code === "42P01" || /vault_files|vault_folders/.test(text);
        host.innerHTML = `<p class="empty-note">${missing ? "File vault database is not set up yet." : escapeHtml(text)}</p>`;
        return;
    }
    const names = new Map((folderRes.data || []).map((folder) => [folder.id, folder.name]));
    const rows = fileRes.data || [];
    if (!rows.length) {
        host.innerHTML = `<p class="empty-note">No vault files yet.</p>`;
        return;
    }
    host.innerHTML = rows.map((row) => {
        const folder = names.get(row.folder_id) || "Folder";
        const when = displayDate(row.created_at) || "";
        return `<a class="recent-row" href="vault.html">
            <span><strong>${escapeHtml(row.name)}</strong> · ${escapeHtml(folder)}</span>
            <span>${escapeHtml(when)}</span>
        </a>`;
    }).join("");
}

async function loadStats() {
    const statusEl = document.getElementById("dash-status");
    const today = saToday();
    const monthStart = today.slice(0, 8) + "01";

    const fullInvoiceSelect = "id, kind, status, reference, number, due_date, total, amount_paid, balance_due, issue_date, created_at, tracked_amount, marked_paid, clients(name)";
    const baseInvoiceSelect = "id, kind, status, reference, number, due_date, total, balance_due, issue_date, created_at, clients(name)";
    let invoiceRes = await supabase.from("invoices").select(fullInvoiceSelect).order("created_at", { ascending: false });
    let ledgerColumns = true;
    if (invoiceRes.error && missingLedgerColumn(invoiceRes.error)) {
        ledgerColumns = false;
        invoiceRes = await supabase.from("invoices").select(baseInvoiceSelect).order("created_at", { ascending: false });
    }
    const [paymentRes, clientRes, uploadRes, eventRes, vaultRes] = await Promise.all([
        supabase.from("payments").select("amount, paid_on").gte("paid_on", monthStart).lte("paid_on", today),
        supabase.from("clients").select("id, name, archived"),
        supabase.from("invoice_uploads").select("id, client_id, name, amount, amount_paid, paid, created_at").order("created_at", { ascending: false }),
        supabase.from("invoice_paid_events").select("delta, created_at").gte("created_at", `${monthStart}T00:00:00+02:00`),
        supabase.from("vault_files").select("id", { count: "exact", head: true }),
    ]);

    const uploadMissing = uploadRes.error && (missingUploadsTable(uploadRes.error) || /amount_paid/.test(uploadRes.error.message || ""));
    const eventsMissing = eventRes.error && missingPaidEvents(eventRes.error);
    const failed = [invoiceRes.error, paymentRes.error, clientRes.error, uploadMissing ? null : uploadRes.error, eventsMissing ? null : eventRes.error].filter(Boolean);
    if (failed.length) {
        statusEl.hidden = false;
        statusEl.textContent = failed.map(errText).join(" ");
        return;
    }

    const invoices = invoiceRes.data || [];
    const clientRows = clientRes.data || [];
    const clientNames = new Map(clientRows.map((client) => [client.id, client.name]));
    const uploads = (uploadMissing ? [] : (uploadRes.data || [])).map((row) => ({
        ...row,
        client_name: clientNames.get(row.client_id) || "No client",
    }));
    let outstanding = 0;
    let overdue = [];
    let overdueAmount = 0;
    if (ledgerColumns) {
        const entries = invoices.map((row) => entryFromApp(row)).concat(uploads.map((row) => entryFromUpload(row)));
        outstanding = summarise(entries).outstanding;
        overdue = entries.filter((row) => isOverdueEntry(row, today));
        overdueAmount = overdue.reduce((sum, row) => sum + splitAmount(row).outstanding, 0);
    } else {
        const open = invoices.filter((row) => row.kind === "invoice" && (row.status === "sent" || row.status === "partially_paid"));
        outstanding = open.reduce((sum, row) => sum + Number(row.balance_due || 0), 0);
        overdue = open.filter((row) => row.due_date && row.due_date < today);
        overdueAmount = overdue.reduce((sum, row) => sum + Number(row.balance_due || 0), 0);
    }
    const paidMonth = monthReceived(
        (paymentRes.data || []).map((row) => row.amount),
        eventsMissing ? [] : (eventRes.data || []).map((row) => row.delta),
    );
    const vaultCount = vaultRes.error ? null : vaultRes.count;

    document.getElementById("stat-outstanding").textContent = money.format(outstanding);
    const overdueEl = document.getElementById("stat-overdue");
    if (overdueEl) overdueEl.textContent = `${overdue.length} overdue · ${money.format(overdueAmount)}`;
    document.getElementById("stat-paid").textContent = money.format(paidMonth);
    const clientsEl = document.getElementById("stat-clients");
    if (clientsEl) clientsEl.textContent = String(clientRows.filter((client) => !client.archived).length);
    const vaultEl = document.getElementById("stat-vault");
    if (vaultEl) vaultEl.textContent = vaultCount == null ? "—" : String(vaultCount);

    const recentInvoices = invoices.filter((row) => row.kind === "invoice").map((row) => ({
        href: `invoice.html?id=${encodeURIComponent(row.id)}`,
        label: row.reference || (row.number ? `#${row.number}` : "Draft"),
        client: row.clients?.name || "No client",
        status: ledgerColumns ? (payStatus(entryFromApp(row)) || row.status) : row.status,
        late: ledgerColumns ? isOverdueEntry(entryFromApp(row), today) : ((row.status === "sent" || row.status === "partially_paid") && row.due_date && row.due_date < today),
        amount: ledgerColumns ? invoiceTotal(entryFromApp(row)) : Number(row.total || 0),
        paid: ledgerColumns ? displayedPaid(entryFromApp(row)) : Number(row.balance_due == null ? 0 : row.total || 0),
        created_at: row.created_at || "",
    }));
    const recentUploads = uploads.map((row) => ({
        href: `invoice.html?client=${encodeURIComponent(row.client_id)}`,
        label: row.name,
        client: row.client_name || "No client",
        status: payStatus(entryFromUpload(row)) || "uploaded",
        late: false,
        amount: invoiceTotal(entryFromUpload(row)),
        paid: displayedPaid(entryFromUpload(row)),
        created_at: row.created_at || "",
    }));
    const recent = recentInvoices.concat(recentUploads)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 5);
    const host = document.getElementById("recent-invoices");
    if (!recent.length) {
        host.innerHTML = `<p class="empty-note">No invoices yet. Open the Invoice Generator to create a draft.</p>`;
        return;
    }
    host.innerHTML = recent.map((row) => `<a class="recent-row" href="${row.href}">
            <span><strong>${escapeHtml(row.label)}</strong> · ${escapeHtml(row.client)}</span>
            <span>${escapeHtml(row.status)}${row.late ? ' <em class="overdue">overdue</em>' : ""} · ${money.format(row.paid || 0)} paid of ${money.format(row.amount)}</span>
        </a>`).join("");
}

async function importBrowserData() {
    const result = document.getElementById("import-result");
    result.hidden = false;
    const read = (key) => {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            throw new Error(`${key} is not valid JSON (${err.message}).`);
        }
    };

    let storedClients = [];
    let storedServices = [];
    let storedInvoices = [];
    try {
        storedClients = read("dc_clients");
        storedServices = read("dc_services");
        storedInvoices = read("dc_invoices");
    } catch (err) {
        result.textContent = err.message;
        return;
    }

    const existingClients = await supabase.from("clients").select("id, name");
    const existingServices = await supabase.from("services").select("id, name");
    if (existingClients.error || existingServices.error) {
        result.textContent = errText(existingClients.error || existingServices.error);
        return;
    }

    const clientNames = new Set((existingClients.data || []).map((row) => row.name.trim().toLowerCase()));
    const serviceNames = new Set((existingServices.data || []).map((row) => row.name.trim().toLowerCase()));
    const lines = [];
    let addedClients = 0;
    let addedServices = 0;

    for (const client of storedClients) {
        const name = String(client.name || "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (clientNames.has(key)) continue;
        const { error } = await supabase.from("clients").insert({
            name,
            email: client.email || null,
            phone: client.phone || null,
            address: client.address || null,
        });
        if (error) {
            lines.push(`Client “${name}” was not added: ${errText(error)}`);
            continue;
        }
        clientNames.add(key);
        addedClients += 1;
    }

    for (const service of storedServices) {
        const name = String(service.name || "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (serviceNames.has(key)) continue;
        const price = Number(service.price ?? service.unit_price ?? 0);
        const { error } = await supabase.from("services").insert({
            name,
            unit_price: Number.isFinite(price) && price >= 0 ? price : 0,
            description: service.description || null,
        });
        if (error) {
            lines.push(`Service “${name}” was not added: ${errText(error)}`);
            continue;
        }
        serviceNames.add(key);
        addedServices += 1;
    }

    lines.unshift(`Added ${addedClients} client${addedClients === 1 ? "" : "s"} and ${addedServices} service${addedServices === 1 ? "" : "s"} that were not already saved.`);

    if (!storedInvoices.length) {
        lines.push("No invoices were found in this browser (dc_invoices).");
    } else {
        lines.push("These browser invoices cannot be inserted with their old numbers from the website. The database only issues numbers when a draft is finalised, or when a privileged SQL import runs. Send this list to us:");
        storedInvoices.forEach((invoice) => {
            const number = invoice.invoiceNumber ?? invoice.number ?? "?";
            const client = invoice.clientName || invoice.client?.name || "Unknown client";
            const total = invoice.total ?? "";
            const status = invoice.status || "";
            lines.push(`#${number} · ${client} · ${status} · ${total}`);
        });
    }

    result.textContent = lines.join("\n");
    await loadStats();
}
