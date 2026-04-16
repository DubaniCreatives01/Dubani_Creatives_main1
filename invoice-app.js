/* ========================================
   Dubani Creatives — Invoice Generator
   Application Logic
======================================== */

const App = {
    // Default business info from the user's existing invoice
    defaults: {
        companyName: "Dubani Creatives Pty.Ltd",
        address: "11553 Ndwana crescent Browns farm Philippi, Cape Town\nSouth Africa",
        email: "dubanicreatives@gmail.com",
        phone: "+27 733464805",
        website: "admin@dubanicreatives.com",
        taxReg: "Tax Reg No.9695889171 : 2020/073382/07",
        bankDetails: "Capitec, (Account Number) 1444414540, (Account Holder) MR SC DUBANI Capitec Client pay : 0733464805",
        paymentNote: "A payment of the quoted fee will become immediately due upon acceptance of the project. Additional inter-est may be charged on payment received more than 5 days past its due date.",
        terms: "The following Terms and Conditions of Service apply to all products and services provided by Dubani Creatives Pty.Ltd and in the event of any dispute are governed by the laws of South Africa.\nAll work is carried out by Dubani Creatives on the understanding that the client has agreed to our terms and conditions.\nCopyright is retained by Dubani Creatives on all design work including words, pictures, ideas, visuals and illustrations unless specifically released in writing and after all costs have been settled.",
        taxRate: 0,
        currency: "ZAR"
    },

    state: {
        invoiceNumber: 389,
        items: [{ service: "", description: "", qty: 1, rate: 0 }],
        client: { name: "", email: "", phone: "", address: "" },
        invoiceDate: "",
        dueDate: "",
        discount: 0,
        discountType: "percent",
        taxRate: 0,
        notes: "",
    },

    init() {
        this.loadData();
        this.setDefaultDates();
        this.preloadLogo().then(() => {
            this.bindEvents();
            this.renderForm();
            this.updatePreview();
        });
    },

    logoBase64: "",

    async preloadLogo() {
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = "images/logo1.png";
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext("2d").drawImage(img, 0, 0);
            this.logoBase64 = canvas.toDataURL("image/png");
        } catch (e) {
            // Fallback: use relative path
            this.logoBase64 = "images/logo1.png";
        }
    },

    // ---- LocalStorage ----
    loadData() {
        const counter = localStorage.getItem("dc_invoice_counter");
        if (counter) this.state.invoiceNumber = parseInt(counter);

        const settings = localStorage.getItem("dc_settings");
        if (settings) Object.assign(this.defaults, JSON.parse(settings));

        this.state.taxRate = this.defaults.taxRate;
        this.state.notes = this.defaults.bankDetails + "\n\n" + this.defaults.paymentNote;
    },

    saveCounter() {
        localStorage.setItem("dc_invoice_counter", this.state.invoiceNumber);
    },

    getClients() {
        return JSON.parse(localStorage.getItem("dc_clients") || "[]");
    },

    saveClient(client) {
        const clients = this.getClients();
        const existing = clients.findIndex(c => c.name.toLowerCase() === client.name.toLowerCase());
        if (existing >= 0) {
            clients[existing] = client;
        } else {
            clients.push(client);
        }
        localStorage.setItem("dc_clients", JSON.stringify(clients));
    },

    deleteClient(name) {
        const clients = this.getClients().filter(c => c.name !== name);
        localStorage.setItem("dc_clients", JSON.stringify(clients));
    },

    getServices() {
        return JSON.parse(localStorage.getItem("dc_services") || "[]");
    },

    saveService(service) {
        const services = this.getServices();
        const existing = services.findIndex(s => s.name.toLowerCase() === service.name.toLowerCase());
        if (existing >= 0) {
            services[existing] = service;
        } else {
            services.push(service);
        }
        localStorage.setItem("dc_services", JSON.stringify(services));
    },

    deleteService(name) {
        const services = this.getServices().filter(s => s.name !== name);
        localStorage.setItem("dc_services", JSON.stringify(services));
    },

    // ---- Invoices History ----
    getInvoices() {
        return JSON.parse(localStorage.getItem("dc_invoices") || "[]");
    },

    saveInvoiceRecord() {
        if (!this.state.client.name) return; // Need a client to save history
        const invoices = this.getInvoices();
        const existingIdx = invoices.findIndex(i => i.invoiceNumber === this.state.invoiceNumber);

        const record = {
            invoiceNumber: this.state.invoiceNumber,
            date: this.state.invoiceDate,
            clientName: this.state.client.name,
            total: this.calcTotal(),
            currency: this.defaults.currency,
            itemsCount: this.state.items.filter(i => i.service).length
        };

        if (existingIdx >= 0) {
            invoices[existingIdx] = record;
        } else {
            invoices.push(record);
        }

        // Sort descending by number
        invoices.sort((a, b) => b.invoiceNumber - a.invoiceNumber);
        localStorage.setItem("dc_invoices", JSON.stringify(invoices));
    },

    deleteInvoiceRecord(invoiceNumber) {
        let invoices = this.getInvoices();
        invoices = invoices.filter(i => i.invoiceNumber !== parseInt(invoiceNumber));
        localStorage.setItem("dc_invoices", JSON.stringify(invoices));
    },

    // ---- Dates ----
    setDefaultDates() {
        const today = new Date();
        this.state.invoiceDate = this.formatDateInput(today);
        this.state.dueDate = this.formatDateInput(today);
    },

    formatDateInput(date) {
        return date.toISOString().split("T")[0];
    },

    formatDateDisplay(dateStr) {
        if (!dateStr) return "";
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
    },

    // ---- Calculations ----
    calcLineTotal(item) {
        return (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    },

    calcSubtotal() {
        return this.state.items.reduce((sum, item) => sum + this.calcLineTotal(item), 0);
    },

    calcDiscount() {
        const sub = this.calcSubtotal();
        if (this.state.discountType === "percent") {
            return sub * ((parseFloat(this.state.discount) || 0) / 100);
        }
        return parseFloat(this.state.discount) || 0;
    },

    calcTax() {
        return (this.calcSubtotal() - this.calcDiscount()) * ((parseFloat(this.state.taxRate) || 0) / 100);
    },

    calcTotal() {
        return this.calcSubtotal() - this.calcDiscount() + this.calcTax();
    },

    formatCurrency(amount) {
        return `${this.defaults.currency} ${amount.toFixed(2)}`;
    },

    // ---- Event Binding ----
    bindEvents() {
        // Invoice number
        document.getElementById("invoiceNumber").addEventListener("input", e => {
            this.state.invoiceNumber = parseInt(e.target.value) || 0;
            this.updatePreview();
        });

        // Dates
        document.getElementById("invoiceDate").addEventListener("change", e => {
            this.state.invoiceDate = e.target.value;
            this.updatePreview();
        });
        document.getElementById("dueDate").addEventListener("change", e => {
            this.state.dueDate = e.target.value;
            this.updatePreview();
        });

        // Client fields
        ["clientName", "clientEmail", "clientPhone", "clientAddress"].forEach(id => {
            document.getElementById(id).addEventListener("input", e => {
                const key = id.replace("client", "").toLowerCase();
                this.state.client[key] = e.target.value;
                this.updatePreview();
            });
        });

        // Client select
        document.getElementById("clientSelect").addEventListener("change", e => {
            if (e.target.value === "") return;
            const client = this.getClients().find(c => c.name === e.target.value);
            if (client) {
                this.state.client = { ...client };
                document.getElementById("clientName").value = client.name;
                document.getElementById("clientEmail").value = client.email || "";
                document.getElementById("clientPhone").value = client.phone || "";
                document.getElementById("clientAddress").value = client.address || "";
                this.updatePreview();
            }
        });

        // Tax & Discount
        document.getElementById("taxRate").addEventListener("input", e => {
            this.state.taxRate = parseFloat(e.target.value) || 0;
            this.updatePreview();
        });

        document.getElementById("discount").addEventListener("input", e => {
            this.state.discount = parseFloat(e.target.value) || 0;
            this.updatePreview();
        });

        document.getElementById("discountType").addEventListener("change", e => {
            this.state.discountType = e.target.value;
            this.updatePreview();
        });

        // Notes
        document.getElementById("invoiceNotes").addEventListener("input", e => {
            this.state.notes = e.target.value;
            this.updatePreview();
        });

        // Add item button
        document.getElementById("addItemBtn").addEventListener("click", () => {
            this.state.items.push({ service: "", description: "", qty: 1, rate: 0 });
            this.renderItems();
            this.updatePreview();
        });

        // Export buttons
        document.getElementById("downloadPdf").addEventListener("click", () => this.downloadPDF());
        document.getElementById("shareWhatsapp").addEventListener("click", () => this.shareWhatsApp());
        document.getElementById("shareEmail").addEventListener("click", () => this.shareEmail());

        // Save client button
        document.getElementById("saveClientBtn").addEventListener("click", () => {
            if (this.state.client.name.trim()) {
                this.saveClient({ ...this.state.client });
                this.populateClientSelect();
                alert("Client saved!");
            }
        });

        // Modal buttons
        document.getElementById("manageClientsBtn").addEventListener("click", () => this.showModal("clientsModal"));
        document.getElementById("manageServicesBtn").addEventListener("click", () => this.showModal("servicesModal"));
        document.getElementById("settingsBtn").addEventListener("click", () => this.showModal("settingsModal"));

        // Close modals
        document.querySelectorAll(".modal-close").forEach(btn => {
            btn.addEventListener("click", () => {
                btn.closest(".modal-overlay").classList.remove("active");
            });
        });

        document.querySelectorAll(".modal-overlay").forEach(overlay => {
            overlay.addEventListener("click", e => {
                if (e.target === overlay) overlay.classList.remove("active");
            });
        });

        // Add service form
        document.getElementById("addServiceForm").addEventListener("submit", e => {
            e.preventDefault();
            const name = document.getElementById("newServiceName").value.trim();
            const price = parseFloat(document.getElementById("newServicePrice").value) || 0;
            if (name) {
                this.saveService({ name, price });
                document.getElementById("newServiceName").value = "";
                document.getElementById("newServicePrice").value = "";
                this.renderServicesModal();
                this.renderItems();
            }
        });

        // Add client form
        document.getElementById("addClientForm").addEventListener("submit", e => {
            e.preventDefault();
            const name = document.getElementById("newClientName").value.trim();
            const email = document.getElementById("newClientEmail").value.trim();
            const phone = document.getElementById("newClientPhone").value.trim();
            if (name) {
                this.saveClient({ name, email, phone, address: "" });
                document.getElementById("newClientName").value = "";
                document.getElementById("newClientEmail").value = "";
                document.getElementById("newClientPhone").value = "";
                this.renderClientsModal();
                this.populateClientSelect();
            }
        });

        // Settings save
        document.getElementById("saveSettingsBtn").addEventListener("click", () => this.saveSettings());

        // New invoice
        document.getElementById("newInvoiceBtn").addEventListener("click", () => this.newInvoice());
    },

    // ---- Render ----
    renderForm() {
        document.getElementById("invoiceNumber").value = this.state.invoiceNumber;
        document.getElementById("invoiceDate").value = this.state.invoiceDate;
        document.getElementById("dueDate").value = this.state.dueDate;
        document.getElementById("taxRate").value = this.state.taxRate;
        document.getElementById("invoiceNotes").value = this.state.notes;

        this.populateClientSelect();
        this.renderItems();
    },

    populateClientSelect() {
        const select = document.getElementById("clientSelect");
        const clients = this.getClients();
        select.innerHTML = '<option value="">— Select saved client —</option>';
        clients.forEach(c => {
            select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
    },

    renderItems() {
        const tbody = document.getElementById("itemsBody");
        const services = this.getServices();

        tbody.innerHTML = "";
        this.state.items.forEach((item, idx) => {
            const serviceOptions = services.map(s =>
                `<option value="${s.name}" ${item.service === s.name ? "selected" : ""}>${s.name}</option>`
            ).join("");

            const total = this.calcLineTotal(item);

            tbody.innerHTML += `
                <tr>
                    <td>
                        <select class="item-input item-service" data-idx="${idx}">
                            <option value="">Type or select...</option>
                            ${serviceOptions}
                        </select>
                        <input type="text" class="item-input item-service-custom" data-idx="${idx}" placeholder="Or type service name" value="${item.service}" style="margin-top:4px;">
                    </td>
                    <td><input type="text" class="item-input item-desc" data-idx="${idx}" placeholder="Description" value="${item.description}"></td>
                    <td><input type="number" class="item-input item-qty" data-idx="${idx}" min="1" value="${item.qty}"></td>
                    <td><input type="number" class="item-input item-rate" data-idx="${idx}" min="0" step="0.01" value="${item.rate}"></td>
                    <td><span class="line-total">${this.formatCurrency(total)}</span></td>
                    <td><button class="remove-item-btn" data-idx="${idx}">×</button></td>
                </tr>
            `;
        });

        // Bind item events
        tbody.querySelectorAll(".item-service").forEach(el => {
            el.addEventListener("change", e => {
                const idx = parseInt(e.target.dataset.idx);
                const service = services.find(s => s.name === e.target.value);
                if (service) {
                    this.state.items[idx].service = service.name;
                    this.state.items[idx].rate = service.price;
                    this.renderItems();
                    this.updatePreview();
                }
            });
        });

        tbody.querySelectorAll(".item-service-custom").forEach(el => {
            el.addEventListener("input", e => {
                this.state.items[parseInt(e.target.dataset.idx)].service = e.target.value;
                this.updatePreview();
            });
        });

        tbody.querySelectorAll(".item-desc").forEach(el => {
            el.addEventListener("input", e => {
                this.state.items[parseInt(e.target.dataset.idx)].description = e.target.value;
                this.updatePreview();
            });
        });

        tbody.querySelectorAll(".item-qty").forEach(el => {
            el.addEventListener("input", e => {
                this.state.items[parseInt(e.target.dataset.idx)].qty = parseFloat(e.target.value) || 0;
                this.renderItems();
                this.updatePreview();
            });
        });

        tbody.querySelectorAll(".item-rate").forEach(el => {
            el.addEventListener("input", e => {
                this.state.items[parseInt(e.target.dataset.idx)].rate = parseFloat(e.target.value) || 0;
                this.renderItems();
                this.updatePreview();
            });
        });

        tbody.querySelectorAll(".remove-item-btn").forEach(el => {
            el.addEventListener("click", e => {
                const idx = parseInt(e.target.dataset.idx);
                if (this.state.items.length > 1) {
                    this.state.items.splice(idx, 1);
                    this.renderItems();
                    this.updatePreview();
                }
            });
        });

        // Update form totals
        document.getElementById("formSubtotal").textContent = this.formatCurrency(this.calcSubtotal());
        document.getElementById("formDiscount").textContent = "- " + this.formatCurrency(this.calcDiscount());
        document.getElementById("formTax").textContent = this.formatCurrency(this.calcTax());
        document.getElementById("formTotal").textContent = this.formatCurrency(this.calcTotal());
    },

    // ---- Live Preview ----
    updatePreview() {
        const p = document.getElementById("invoicePreview");
        const subtotal = this.calcSubtotal();
        const discount = this.calcDiscount();
        const tax = this.calcTax();
        const total = this.calcTotal();

        const itemsHtml = this.state.items.filter(i => i.service).map(item => `
            <tr>
                <td>
                    <div class="inv-item-name">${this.escHtml(item.service)}</div>
                    ${item.description ? `<div class="inv-item-desc">${this.escHtml(item.description)}</div>` : ""}
                </td>
                <td>${item.qty}</td>
                <td>${this.formatCurrency(parseFloat(item.rate) || 0)}</td>
                <td>${this.formatCurrency(this.calcLineTotal(item))}</td>
            </tr>
        `).join("");

        const notesHtml = this.state.notes ? this.state.notes.replace(/\n/g, "<br>") : "";

        p.innerHTML = `
            <div class="inv-header">
                <div class="inv-logo"><img src="${this.logoBase64}" alt="Dubani Creatives"></div>
                <div class="inv-title-block">
                    <div class="inv-title">INVOICE</div>
                    <div class="inv-number"># ${this.state.invoiceNumber}</div>
                </div>
            </div>

            <div class="inv-details-grid">
                <div class="inv-from">
                    <p>
                        <strong>${this.defaults.companyName}</strong><br>
                        ${this.defaults.address.replace(/\n/g, "<br>")}<br>
                        ${this.defaults.email}<br>
                        ${this.defaults.phone}<br>
                        ${this.defaults.website}<br>
                        ${this.defaults.taxReg}
                    </p>
                </div>
                <div class="inv-dates">
                    <table class="inv-dates-table">
                        <tr><td>Date:</td><td>${this.formatDateDisplay(this.state.invoiceDate)}</td></tr>
                        <tr><td>Due Date:</td><td>${this.formatDateDisplay(this.state.dueDate)}</td></tr>
                    </table>
                    <div class="inv-balance-due">
                        <span>Balance Due:</span>
                        <span>${this.formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <h4 style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#999; margin-bottom:4px;">Bill To:</h4>
                <p style="font-size:14px; color:#1a1a1a;">
                    <strong>${this.escHtml(this.state.client.name) || "—"}</strong><br>
                    ${this.state.client.phone ? this.escHtml(this.state.client.phone) + "<br>" : ""}
                    ${this.state.client.email ? this.escHtml(this.state.client.email) + "<br>" : ""}
                    ${this.state.client.address ? this.escHtml(this.state.client.address) : ""}
                </p>
            </div>

            <table class="inv-items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml || '<tr><td colspan="4" style="text-align:center; color:#ccc; padding:20px;">No items added yet</td></tr>'}</tbody>
            </table>

            <div class="inv-totals">
                <table class="inv-totals-table">
                    <tr><td>Subtotal:</td><td>${this.formatCurrency(subtotal)}</td></tr>
                    ${discount > 0 ? `<tr><td>Discount:</td><td>- ${this.formatCurrency(discount)}</td></tr>` : ""}
                    <tr><td>Tax (${this.state.taxRate}%):</td><td>${this.formatCurrency(tax)}</td></tr>
                    <tr class="inv-grand-total"><td>Total:</td><td>${this.formatCurrency(total)}</td></tr>
                </table>
            </div>

            ${this.state.notes ? `
                <div class="inv-notes">
                    <h4>Notes:</h4>
                    <p>${notesHtml}</p>
                </div>
            ` : ""}

            <div class="inv-terms">
                <h4>Terms:</h4>
                <p>${this.defaults.terms.replace(/\n/g, "<br>")}</p>
            </div>
        `;
    },

    escHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    },

    // ---- Export (jsPDF) ----
    _getFilename() {
        const clientName = (this.state.client.name || "Client").replace(/[^a-zA-Z0-9]/g, "_");
        return `Invoice_${this.state.invoiceNumber}_${clientName}.pdf`;
    },

    _buildPDF() {
        // Handle different global names jsPDF may use
        const JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!JsPDF) {
            throw new Error("jsPDF library not loaded. Please check your internet connection and refresh.");
        }
        const doc = new JsPDF({ unit: "mm", format: "a4" });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 20;
        const rightCol = pageW - margin;
        let y = 25;

        // --- Header ---
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text("INVOICE", rightCol, y, { align: "right" });
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120);
        doc.text(`# ${this.state.invoiceNumber}`, rightCol, y + 8, { align: "right" });

        // Company name (left)
        doc.setTextColor(30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(this.defaults.companyName, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80);
        y += 7;
        const addressLines = this.defaults.address.split("\n");
        addressLines.forEach(line => {
            doc.text(line, margin, y);
            y += 4;
        });
        doc.text(this.defaults.email, margin, y); y += 4;
        doc.text(this.defaults.phone, margin, y); y += 4;
        doc.text(this.defaults.website, margin, y); y += 4;
        doc.text(this.defaults.taxReg, margin, y); y += 4;

        // Separator line
        y += 2;
        doc.setDrawColor(30);
        doc.setLineWidth(0.5);
        doc.line(margin, y, rightCol, y);
        y += 6;

        // --- Dates (right side) ---
        const dateStartY = y;
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text("Date:", rightCol - 45, y);
        doc.setTextColor(30);
        doc.text(this.formatDateDisplay(this.state.invoiceDate), rightCol, y, { align: "right" });
        y += 5;
        doc.setTextColor(120);
        doc.text("Due Date:", rightCol - 45, y);
        doc.setTextColor(30);
        doc.text(this.formatDateDisplay(this.state.dueDate), rightCol, y, { align: "right" });
        y += 7;

        // Balance Due box
        doc.setFillColor(30, 30, 30);
        doc.rect(rightCol - 80, y - 1, 80, 10, "F");
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Balance Due:", rightCol - 76, y + 5);
        doc.text(this.formatCurrency(this.calcTotal()), rightCol - 4, y + 5, { align: "right" });
        doc.setFont("helvetica", "normal");

        // --- Bill To (left side, same height) ---
        let billY = dateStartY;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Bill To:", margin, billY);
        billY += 5;
        doc.setFontSize(11);
        doc.setTextColor(30);
        doc.setFont("helvetica", "bold");
        doc.text(this.state.client.name || "—", margin, billY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        billY += 5;
        if (this.state.client.phone) { doc.text(this.state.client.phone, margin, billY); billY += 4; }
        if (this.state.client.email) { doc.text(this.state.client.email, margin, billY); billY += 4; }
        if (this.state.client.address) { doc.text(this.state.client.address, margin, billY); billY += 4; }

        y += 16;

        // --- Items Table ---
        const items = this.state.items.filter(i => i.service);
        const tableBody = items.map(item => [
            item.service + (item.description ? "\n" + item.description : ""),
            String(item.qty),
            this.formatCurrency(parseFloat(item.rate) || 0),
            this.formatCurrency(this.calcLineTotal(item))
        ]);

        if (tableBody.length === 0) {
            tableBody.push(["No items added", "", "", ""]);
        }

        doc.autoTable({
            startY: y,
            head: [["Item", "Qty", "Rate", "Amount"]],
            body: tableBody,
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: [255, 94, 0],
                textColor: 255,
                fontStyle: "bold",
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [50, 50, 50]
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 20, halign: "center" },
                2: { cellWidth: 35, halign: "right" },
                3: { cellWidth: 35, halign: "right" }
            },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            theme: "grid"
        });

        y = doc.lastAutoTable.finalY + 8;

        // --- Totals ---
        const subtotal = this.calcSubtotal();
        const discount = this.calcDiscount();
        const tax = this.calcTax();
        const total = this.calcTotal();

        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text("Subtotal:", rightCol - 50, y);
        doc.setTextColor(30);
        doc.text(this.formatCurrency(subtotal), rightCol, y, { align: "right" });
        y += 5;

        if (discount > 0) {
            doc.setTextColor(120);
            doc.text("Discount:", rightCol - 50, y);
            doc.setTextColor(30);
            doc.text("- " + this.formatCurrency(discount), rightCol, y, { align: "right" });
            y += 5;
        }

        doc.setTextColor(120);
        doc.text(`Tax (${this.state.taxRate}%):`, rightCol - 50, y);
        doc.setTextColor(30);
        doc.text(this.formatCurrency(tax), rightCol, y, { align: "right" });
        y += 3;

        doc.setDrawColor(30);
        doc.setLineWidth(0.5);
        doc.line(rightCol - 55, y, rightCol, y);
        y += 6;

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30);
        doc.text("Total:", rightCol - 50, y);
        doc.text(this.formatCurrency(total), rightCol, y, { align: "right" });
        doc.setFont("helvetica", "normal");
        y += 12;

        // --- Notes ---
        if (this.state.notes) {
            doc.setFontSize(10);
            doc.setTextColor(255, 94, 0);
            doc.setFont("helvetica", "bold");
            doc.text("Notes:", margin, y);
            doc.setFont("helvetica", "normal");
            y += 5;
            doc.setFontSize(8);
            doc.setTextColor(100);
            const noteLines = doc.splitTextToSize(this.state.notes, pageW - margin * 2);
            doc.text(noteLines, margin, y);
            y += noteLines.length * 3.5 + 6;
        }

        // --- Terms ---
        // Check if we need a new page
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setTextColor(255, 94, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Terms:", margin, y);
        doc.setFont("helvetica", "normal");
        y += 5;
        doc.setFontSize(8);
        doc.setTextColor(100);
        const termLines = doc.splitTextToSize(this.defaults.terms, pageW - margin * 2);
        doc.text(termLines, margin, y);

        return doc;
    },

    downloadPDF() {
        const btn = document.getElementById("downloadPdf");
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Generating...";
        btn.disabled = true;

        try {
            this.saveInvoiceRecord(); // Auto-save to history
            const doc = this._buildPDF();
            doc.save(this._getFilename());
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("PDF generation failed: " + err.message);
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 500);
        }
    },

    shareWhatsApp() {
        const btn = document.getElementById("shareWhatsapp");
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Preparing...";
        btn.disabled = true;

        try {
            this.saveInvoiceRecord(); // Auto-save to history
            const doc = this._buildPDF();
            const total = this.formatCurrency(this.calcTotal());
            const clientName = this.state.client.name || "Valued Client";

            // Build a professional WhatsApp message
            const items = this.state.items.filter(i => i.service);
            const itemsList = items.map(i => `  • ${i.service} — ${this.formatCurrency(this.calcLineTotal(i))}`).join("\n");

            const msg =
                `🟠 *DUBANI CREATIVES*\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `Hi *${clientName}* 👋\n\n` +
                `Thank you for choosing Dubani Creatives! Please find your invoice details below:\n\n` +
                `📄 *Invoice #${this.state.invoiceNumber}*\n` +
                `📅 Date: ${this.formatDateDisplay(this.state.invoiceDate)}\n` +
                `⏰ Due: ${this.formatDateDisplay(this.state.dueDate)}\n\n` +
                `*Services:*\n${itemsList}\n\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💰 *Total: ${total}*\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `🏦 *Banking Details:*\n${this.defaults.bankDetails}\n\n` +
                `📌 ${this.defaults.paymentNote}\n\n` +
                `Your invoice PDF is attached below. If you have any questions, feel free to reach out!\n\n` +
                `Thank you for your business! 🙏\n` +
                `— *${this.defaults.companyName}*\n` +
                `📧 ${this.defaults.email}\n` +
                `📞 ${this.defaults.phone}`;

            // Try Web Share API with PDF attachment
            const blob = doc.output("blob");
            const file = new File([blob], this._getFilename(), { type: "application/pdf" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    title: `Invoice #${this.state.invoiceNumber} — ${this.defaults.companyName}`,
                    text: msg,
                    files: [file]
                }).catch(err => {
                    if (err.name !== "AbortError") {
                        // User didn't cancel, share failed — fallback
                        this._whatsappFallback(doc, msg);
                    }
                });
            } else {
                // Desktop fallback: download PDF + open WhatsApp
                this._whatsappFallback(doc, msg);
            }
        } catch (err) {
            console.error("WhatsApp share failed:", err);
            alert("Could not generate invoice. Error: " + err.message);
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1000);
        }
    },

    _whatsappFallback(doc, msg) {
        // Save PDF first
        doc.save(this._getFilename());

        // Open WhatsApp with message
        const phone = (this.state.client.phone || "").replace(/[^0-9]/g, "");
        const waUrl = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;

        setTimeout(() => {
            window.open(waUrl, "_blank");
        }, 600);
    },

    shareEmail() {
        const btn = document.getElementById("shareEmail");
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Preparing...";
        btn.disabled = true;

        try {
            this.saveInvoiceRecord(); // Auto-save to history
            const doc = this._buildPDF();
            const total = this.formatCurrency(this.calcTotal());
            const clientName = this.state.client.name || "Valued Client";

            // Build a professional email body
            const items = this.state.items.filter(i => i.service);
            const itemsList = items.map(i => `  • ${i.service} — ${this.formatCurrency(this.calcLineTotal(i))}`).join("\n");

            const subject = `Invoice #${this.state.invoiceNumber} from ${this.defaults.companyName}`;
            const emailBody =
                `Dear ${clientName},\n\n` +
                `Thank you for choosing Dubani Creatives! Please find your invoice attached.\n\n` +
                `INVOICE SUMMARY\n` +
                `─────────────────────────\n` +
                `Invoice #: ${this.state.invoiceNumber}\n` +
                `Date: ${this.formatDateDisplay(this.state.invoiceDate)}\n` +
                `Due Date: ${this.formatDateDisplay(this.state.dueDate)}\n\n` +
                `Services:\n${itemsList}\n\n` +
                `Total: ${total}\n` +
                `─────────────────────────\n\n` +
                `BANKING DETAILS\n` +
                `${this.defaults.bankDetails}\n\n` +
                `${this.defaults.paymentNote}\n\n` +
                `Please don't hesitate to contact us if you have any questions.\n\n` +
                `Kind regards,\n` +
                `${this.defaults.companyName}\n` +
                `${this.defaults.email}\n` +
                `${this.defaults.phone}`;

            // Try Web Share API with PDF attachment
            const blob = doc.output("blob");
            const file = new File([blob], this._getFilename(), { type: "application/pdf" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    title: subject,
                    text: emailBody,
                    files: [file]
                }).catch(err => {
                    if (err.name !== "AbortError") {
                        this._emailFallback(doc, subject, emailBody);
                    }
                });
            } else {
                // Desktop fallback: download PDF + open mailto
                this._emailFallback(doc, subject, emailBody);
            }
        } catch (err) {
            console.error("Email share failed:", err);
            alert("Could not generate invoice. Error: " + err.message);
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1000);
        }
    },

    _emailFallback(doc, subject, body) {
        // Save PDF first
        doc.save(this._getFilename());

        // Open email client
        const mailto = `mailto:${this.state.client.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setTimeout(() => {
            window.open(mailto);
        }, 600);
    },

    // ---- New Invoice ----
    newInvoice() {
        this.state.invoiceNumber++;
        this.saveCounter();
        this.state.items = [{ service: "", description: "", qty: 1, rate: 0 }];
        this.state.client = { name: "", email: "", phone: "", address: "" };
        this.state.discount = 0;
        this.setDefaultDates();

        document.getElementById("clientName").value = "";
        document.getElementById("clientEmail").value = "";
        document.getElementById("clientPhone").value = "";
        document.getElementById("clientAddress").value = "";
        document.getElementById("clientSelect").value = "";
        document.getElementById("discount").value = "0";

        this.renderForm();
        this.updatePreview();
    },

    // ---- Modals ----
    showModal(id) {
        document.getElementById(id).classList.add("active");
        if (id === "clientsModal") this.renderClientsModal();
        if (id === "servicesModal") this.renderServicesModal();
        if (id === "settingsModal") this.renderSettingsModal();
    },

    renderClientsModal() {
        const list = document.getElementById("clientsList");
        const clients = this.getClients();
        const allInvoices = this.getInvoices();

        list.innerHTML = clients.length === 0
            ? '<p style="color: var(--text-muted); font-size: 13px;">No saved clients yet.</p>'
            : clients.map(c => {
                const clientInvoices = allInvoices.filter(i => i.clientName.toLowerCase() === c.name.toLowerCase());
                const invoicesHtml = clientInvoices.length > 0
                    ? `<div class="client-history-list" style="margin-top: 10px; border-top: 1px dashed var(--border); padding-top: 10px;">
                        <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Past Invoices (${clientInvoices.length})</span>
                        <div style="margin-top: 6px; display: grid; gap: 6px;">
                            ${clientInvoices.map(inv => `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; padding: 6px 10px; border-radius: 4px; font-size: 12px;">
                                    <div>
                                        <span style="color: var(--accent); font-weight: bold;">#${inv.invoiceNumber}</span>
                                        <span style="color: var(--text-muted); margin-left: 6px;">${this.formatDateDisplay(inv.date)}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span style="color: var(--text-primary);">${inv.currency} ${parseFloat(inv.total).toFixed(2)}</span>
                                        <button class="btn btn-sm" style="padding: 2px 6px; background: transparent; color: #ff4444;" onclick="App.deleteInvoiceRecord('${inv.invoiceNumber}'); App.renderClientsModal();">×</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                       </div>`
                    : '<div style="margin-top: 10px; font-size: 11px; color: var(--text-muted);">No invoices generated for this client yet.</div>';

                return `
                <div class="saved-item" style="flex-direction: column; align-items: stretch;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="saved-item-info">
                            <h4>${this.escHtml(c.name)}</h4>
                            <p>${this.escHtml(c.phone || "")} ${c.email ? "• " + this.escHtml(c.email) : ""}</p>
                        </div>
                        <div class="saved-item-actions">
                            <button class="btn btn-danger btn-sm" onclick="App.deleteClient('${c.name.replace(/'/g, "\\'")}'); App.renderClientsModal(); App.populateClientSelect();">Delete Client</button>
                        </div>
                    </div>
                    ${invoicesHtml}
                </div>
            `}).join("");
    },

    renderServicesModal() {
        const list = document.getElementById("servicesList");
        const services = this.getServices();
        list.innerHTML = services.length === 0
            ? '<p style="color: var(--text-muted); font-size: 13px;">No saved services yet.</p>'
            : services.map(s => `
                <div class="saved-item">
                    <div class="saved-item-info">
                        <h4>${this.escHtml(s.name)}</h4>
                        <p>${App.formatCurrency(s.price)}</p>
                    </div>
                    <div class="saved-item-actions">
                        <button class="btn btn-danger btn-sm" onclick="App.deleteService('${s.name.replace(/'/g, "\\'")}'); App.renderServicesModal(); App.renderItems();">Delete</button>
                    </div>
                </div>
            `).join("");
    },

    renderSettingsModal() {
        document.getElementById("settCompany").value = this.defaults.companyName;
        document.getElementById("settAddress").value = this.defaults.address;
        document.getElementById("settEmail").value = this.defaults.email;
        document.getElementById("settPhone").value = this.defaults.phone;
        document.getElementById("settBank").value = this.defaults.bankDetails;
        document.getElementById("settTaxReg").value = this.defaults.taxReg;
        document.getElementById("settDefaultTax").value = this.defaults.taxRate;
    },

    saveSettings() {
        this.defaults.companyName = document.getElementById("settCompany").value;
        this.defaults.address = document.getElementById("settAddress").value;
        this.defaults.email = document.getElementById("settEmail").value;
        this.defaults.phone = document.getElementById("settPhone").value;
        this.defaults.bankDetails = document.getElementById("settBank").value;
        this.defaults.taxReg = document.getElementById("settTaxReg").value;
        this.defaults.taxRate = parseFloat(document.getElementById("settDefaultTax").value) || 0;

        localStorage.setItem("dc_settings", JSON.stringify(this.defaults));
        this.updatePreview();
        document.getElementById("settingsModal").classList.remove("active");
        alert("Settings saved!");
    }
};

// Boot
document.addEventListener("DOMContentLoaded", () => App.init());
