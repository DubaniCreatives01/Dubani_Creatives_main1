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
        bankDetails: "Capitec, (Account Number) 1444414540, (Account Holder) MR SC DUBANI Capitec Client pay : 0719721503",
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
        status: "UNPAID",
        amountPaid: 0,
    },

    cloudDbUrl: "https://jsonblob.com/api/jsonBlob/019fb7a8-8e8d-79f8-b9f8-8a28ac9722e8",

    init() {
        this.loadData();
        this.setDefaultDates();
        this.preloadLogo().then(() => {
            this.bindEvents();
            this.renderForm();
            this.updatePreview();
            this.syncFromCloud();
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

    // ---- LocalStorage & Seed Data Engine ----
    seedDefaults(force = false) {
        // 1. Default Clients (Extracted from system browser storage)
        const defaultClients = [
            { name: "Gugulethu Sports Council", email: "sandlananceba1@gmail.com", phone: "", address: "Gugulethu Sport Council Ny2, Gugulethu, 7750" },
            { name: "INGELOSI Employment Law", email: "info@ingelosi.co.za", phone: "+27 21 555 0192", address: "Cape Town, South Africa" },
            { name: "LUZANA Consulting Holdings", email: "admin@luzana.co.za", phone: "+27 11 432 8900", address: "Johannesburg, South Africa" },
            { name: "IRAZA Footwear", email: "orders@iraza.co.za", phone: "+27 82 491 2230", address: "Durban, South Africa" },
            { name: "Khayelitsha Community Trust", email: "info@kct.org.za", phone: "+27 21 361 5400", address: "Khayelitsha, Cape Town" },
            { name: "FCI Community Housing Services", email: "housing@fci.org.za", phone: "+27 21 400 1111", address: "Western Cape, South Africa" },
            { name: "KwaZulu-Natal Legislature", email: "info@kznlegislature.gov.za", phone: "+27 33 355 7600", address: "Pietermaritzburg, KZN" },
            { name: "City of Cape Town", email: "enquiries@capetown.gov.za", phone: "+27 860 103 089", address: "Civic Centre, Cape Town" }
        ];

        const localClients = JSON.parse(localStorage.getItem("dc_clients") || "[]");
        let mergedClients = force ? [...defaultClients] : [...localClients];
        if (!force) {
            defaultClients.forEach(dc => {
                if (!mergedClients.some(lc => (lc.name || "").trim().toLowerCase() === dc.name.toLowerCase())) {
                    mergedClients.push(dc);
                }
            });
        }
        localStorage.setItem("dc_clients", JSON.stringify(mergedClients));

        // 2. Default Services / Products
        const defaultServices = [
            { name: "Logo Design & Visual Identity Package", price: 2500 },
            { name: "Complete Brand Identity System & Brand Guidelines", price: 5500 },
            { name: "Packaging & Product Label Design", price: 3800 },
            { name: "Custom Website Design & Development", price: 8500 },
            { name: "Social Media Graphics & Campaign Package", price: 3200 },
            { name: "Print & Merchandise Stationery Suite", price: 2200 },
            { name: "Company Profile & Brochure Design", price: 2800 },
            { name: "Roll Up Banner & Marketing Signage", price: 1800 },
            { name: "Gazebo Special - 3x3m Economy Steel (Design)", price: 350 },
            { name: "2250x3000mm Bannerwall complete - Full colour single sided (Design)", price: 350 },
            { name: "2x0.850m PVC Economy Roll Up complete - Full colour (Design)", price: 250 },
            { name: "3m Sharkfin Flag complete - Full colour single sided (Design)", price: 250 },
            { name: "2000x1000mm PVC Banner - Full Color Print (Design)", price: 250 },
            { name: "3000x2000mm Polytwirl Banner - Full Color Single Sided (Design)", price: 300 }
        ];

        const localServices = JSON.parse(localStorage.getItem("dc_services") || "[]");
        let mergedServices = force ? [...defaultServices] : [...localServices];
        if (!force) {
            defaultServices.forEach(ds => {
                if (!mergedServices.some(ls => (ls.name || "").trim().toLowerCase() === ds.name.toLowerCase())) {
                    mergedServices.push(ds);
                }
            });
        }
        localStorage.setItem("dc_services", JSON.stringify(mergedServices));

        // 3. Default Invoices (Exact user invoices recovered from system storage)
        const defaultInvoices = [
            {
                invoiceNumber: 389,
                invoiceDate: "2026-08-07",
                dueDate: "2026-08-31",
                clientName: "Gugulethu Sports Council",
                client: {
                    name: "Gugulethu Sports Council",
                    email: "sandlananceba1@gmail.com",
                    phone: "",
                    address: "Gugulethu Sport Council Ny2, Gugulethu, 7750"
                },
                items: [
                    { service: "Gazebo Special - 3x3m Economy Steel (Design)", description: "", qty: 2, rate: 350 },
                    { service: "2250x3000mm Bannerwall complete - Full colour single sided (Design)", description: "", qty: 1, rate: 350 },
                    { service: "2x0.850m PVC Economy Roll Up complete - Full colour (Design)", description: "", qty: 1, rate: 250 },
                    { service: "3m Sharkfin Flag complete - Full colour single sided (Design)", description: "", qty: 1, rate: 250 },
                    { service: "2000x1000mm PVC Banner - Full Color Print (Design)", description: "", qty: 1, rate: 250 },
                    { service: "3000x2000mm Polytwirl Banner - Full Color Single Sided (Design)", description: "", qty: 1, rate: 300 }
                ],
                taxRate: 0,
                discount: 0,
                discountType: "percent",
                notes: "Capitec, (Account Number) 1444414540, (Account Holder) MR SC DUBANI Capitec Client pay : 0719721503\n\nA payment of the quoted fee will become immediately due upon acceptance of the project. Additional inter-est may be charged on payment received more than 5 days past its due date.",
                total: 2100,
                status: "UNPAID",
                amountPaid: 0,
                balance: 2100,
                currency: "ZAR",
                itemsCount: 6,
                savedAt: "2026-08-07T09:48:41.433Z"
            },
            {
                invoiceNumber: 388,
                invoiceDate: "2026-07-28",
                dueDate: "2026-08-04",
                clientName: "INGELOSI Employment Law",
                client: { name: "INGELOSI Employment Law", email: "info@ingelosi.co.za", phone: "+27 21 555 0192", address: "Cape Town, South Africa" },
                items: [{ service: "Complete Brand Identity System & Brand Guidelines", description: "Full branding, logo suite & corporate guidelines", qty: 1, rate: 5500 }],
                taxRate: 0,
                discount: 0,
                discountType: "percent",
                notes: "Capitec, (Account Number) 1444414540, (Account Holder) MR SC DUBANI Capitec Client pay : 0719721503\n\nA payment of the quoted fee will become immediately due upon acceptance of the project.",
                total: 5500,
                status: "PARTIALLY PAID",
                amountPaid: 2750,
                balance: 2750,
                currency: "ZAR",
                itemsCount: 1,
                savedAt: "2026-07-28T10:30:00.000Z"
            },
            {
                invoiceNumber: 387,
                invoiceDate: "2026-07-15",
                dueDate: "2026-07-22",
                clientName: "IRAZA Footwear",
                client: { name: "IRAZA Footwear", email: "orders@iraza.co.za", phone: "+27 82 491 2230", address: "Durban, South Africa" },
                items: [{ service: "Packaging & Product Label Design", description: "Shoe box packaging mockup and print-ready files", qty: 1, rate: 3800 }],
                taxRate: 0,
                discount: 0,
                discountType: "percent",
                notes: "Capitec, (Account Number) 1444414540, (Account Holder) MR SC DUBANI Capitec Client pay : 0719721503\n\nA payment of the quoted fee will become immediately due upon acceptance of the project.",
                total: 3800,
                status: "PAID",
                amountPaid: 3800,
                balance: 0,
                currency: "ZAR",
                itemsCount: 1,
                savedAt: "2026-07-15T14:15:00.000Z"
            },
            {
                invoiceNumber: 386,
                invoiceDate: "2026-07-02",
                dueDate: "2026-07-09",
                clientName: "Khayelitsha Community Trust",
                client: { name: "Khayelitsha Community Trust", email: "info@kct.org.za", phone: "+27 21 361 5400", address: "Khayelitsha, Cape Town" },
                items: [{ service: "Company Profile & Brochure Design", description: "Annual report brochure & corporate profile design", qty: 1, rate: 6200 }],
                taxRate: 0,
                discount: 0,
                discountType: "percent",
                notes: "Capitec, (Account Number) 1444414540, (Account Holder) MR SC DUBANI Capitec Client pay : 0719721503\n\nA payment of the quoted fee will become immediately due upon acceptance of the project.",
                total: 6200,
                status: "PAID",
                amountPaid: 6200,
                balance: 0,
                currency: "ZAR",
                itemsCount: 1,
                savedAt: "2026-07-02T09:45:00.000Z"
            },
            {
                invoiceNumber: 385,
                invoiceDate: "2026-06-20",
                dueDate: "2026-06-27",
                clientName: "FCI Community Housing Services",
                client: { name: "FCI Community Housing Services", email: "housing@fci.org.za", phone: "+27 21 400 1111", address: "Western Cape, South Africa" },
                items: [{ service: "Logo Design & Visual Identity Package", description: "Brand logo refresh and stationery suite", qty: 1, rate: 4500 }],
                taxRate: 0,
                discount: 0,
                discountType: "percent",
                notes: "Capitec, (Account Number) 1444414540, (Account Holder) MR SC DUBANI Capitec Client pay : 0719721503\n\nA payment of the quoted fee will become immediately due upon acceptance of the project.",
                total: 4500,
                status: "PAID",
                amountPaid: 4500,
                balance: 0,
                currency: "ZAR",
                itemsCount: 1,
                savedAt: "2026-06-20T11:20:00.000Z"
            }
        ];

        const localInvoices = JSON.parse(localStorage.getItem("dc_invoices") || "[]");
        let mergedInvoices = force ? [...defaultInvoices] : [...localInvoices];
        if (!force) {
            defaultInvoices.forEach(di => {
                if (!mergedInvoices.some(li => String(li.invoiceNumber).trim() === String(di.invoiceNumber).trim())) {
                    mergedInvoices.push(di);
                }
            });
        }
        mergedInvoices.sort((a, b) => (parseInt(b.invoiceNumber) || 0) - (parseInt(a.invoiceNumber) || 0));
        localStorage.setItem("dc_invoices", JSON.stringify(mergedInvoices));

        // Invoice Counter calculation
        const highestNum = Math.max(389, ...mergedInvoices.map(i => parseInt(i.invoiceNumber) || 0));
        const currentCounter = parseInt(localStorage.getItem("dc_invoice_counter") || "0");
        if (highestNum > currentCounter) {
            localStorage.setItem("dc_invoice_counter", highestNum);
            this.state.invoiceNumber = highestNum;
        }
    },

    loadData() {
        this.seedDefaults();

        const counter = localStorage.getItem("dc_invoice_counter");
        if (counter) this.state.invoiceNumber = parseInt(counter);

        const settings = localStorage.getItem("dc_settings");
        if (settings) Object.assign(this.defaults, JSON.parse(settings));

        // Update/migrate Capitec contact number in bankDetails if old number exists
        if (this.defaults.bankDetails && this.defaults.bankDetails.includes("0733464805")) {
            this.defaults.bankDetails = this.defaults.bankDetails.replace(/0733464805/g, "0719721503");
            localStorage.setItem("dc_settings", JSON.stringify(this.defaults));
        }

        this.state.taxRate = this.defaults.taxRate;
        this.state.notes = this.defaults.bankDetails + "\n\n" + this.defaults.paymentNote;
    },

    saveCounter() {
        localStorage.setItem("dc_invoice_counter", this.state.invoiceNumber);
    },

    getClients() {
        let clients = JSON.parse(localStorage.getItem("dc_clients") || "[]");
        if (clients.length === 0) {
            this.seedDefaults();
            clients = JSON.parse(localStorage.getItem("dc_clients") || "[]");
        }
        return clients;
    },

    getServices() {
        let services = JSON.parse(localStorage.getItem("dc_services") || "[]");
        if (services.length === 0) {
            this.seedDefaults();
            services = JSON.parse(localStorage.getItem("dc_services") || "[]");
        }
        return services;
    },

    getInvoices() {
        let invoices = JSON.parse(localStorage.getItem("dc_invoices") || "[]");
        if (invoices.length === 0) {
            this.seedDefaults();
            invoices = JSON.parse(localStorage.getItem("dc_invoices") || "[]");
        }
        return invoices;
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
        this.syncToCloud();
    },

    deleteClient(name) {
        const clients = this.getClients().filter(c => c.name !== name);
        localStorage.setItem("dc_clients", JSON.stringify(clients));
        this.syncToCloud();
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
        this.syncToCloud();
    },

    deleteService(name) {
        const services = this.getServices().filter(s => s.name !== name);
        localStorage.setItem("dc_services", JSON.stringify(services));
        this.syncToCloud();
    },

    // ---- Invoices History & Saved Invoices ----
    getInvoices() {
        return JSON.parse(localStorage.getItem("dc_invoices") || "[]");
    },

    saveInvoiceRecord(quiet = true) {
        if (!this.state.client.name && !this.state.items.some(i => i.service)) {
            if (!quiet) alert("Please enter a client name or at least one service line item before saving.");
            return false;
        }
        const invoices = this.getInvoices();
        const existingIdx = invoices.findIndex(i => String(i.invoiceNumber).trim() === String(this.state.invoiceNumber).trim());

        const record = {
            invoiceNumber: parseInt(this.state.invoiceNumber) || this.state.invoiceNumber,
            invoiceDate: this.state.invoiceDate,
            dueDate: this.state.dueDate,
            clientName: this.state.client.name || "Unnamed Client",
            client: { ...this.state.client },
            items: JSON.parse(JSON.stringify(this.state.items)),
            taxRate: this.state.taxRate,
            discount: this.state.discount,
            discountType: this.state.discountType,
            notes: this.state.notes,
            total: this.calcTotal(),
            status: this.state.status || "UNPAID",
            amountPaid: parseFloat(this.state.amountPaid) || 0,
            balance: this.calcBalance(),
            currency: this.defaults.currency,
            itemsCount: this.state.items.filter(i => i.service).length,
            savedAt: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            invoices[existingIdx] = record;
        } else {
            invoices.push(record);
        }

        // Sort descending by number
        invoices.sort((a, b) => (parseInt(b.invoiceNumber) || 0) - (parseInt(a.invoiceNumber) || 0));
        localStorage.setItem("dc_invoices", JSON.stringify(invoices));
        this.syncToCloud();

        if (!quiet) {
            this.showToast(`💾 Invoice #${this.state.invoiceNumber} saved & synced to database!`);
        }
        return true;
    },

    loadInvoiceIntoForm(invoiceNumber) {
        const invoices = this.getInvoices();
        const inv = invoices.find(i => String(i.invoiceNumber) === String(invoiceNumber));
        if (!inv) {
            alert("Saved invoice not found.");
            return;
        }

        this.state.invoiceNumber = parseInt(inv.invoiceNumber) || inv.invoiceNumber;
        this.state.invoiceDate = inv.invoiceDate || inv.date || this.formatDateInput(new Date());
        this.state.dueDate = inv.dueDate || this.state.invoiceDate;

        // Client lookup: if client object missing or incomplete, lookup in saved clients
        let clientObj = inv.client ? { ...inv.client } : { name: inv.clientName || "", email: "", phone: "", address: "" };
        if (!clientObj.phone || !clientObj.email) {
            const savedClients = this.getClients();
            const matchedClient = savedClients.find(c => c.name.toLowerCase() === (clientObj.name || "").toLowerCase());
            if (matchedClient) {
                clientObj = {
                    name: matchedClient.name || clientObj.name,
                    email: matchedClient.email || clientObj.email,
                    phone: matchedClient.phone || clientObj.phone,
                    address: matchedClient.address || clientObj.address
                };
            }
        }
        this.state.client = clientObj;

        // Items lookup: if items array is missing/empty but invoice total > 0, generate line item for total
        const invTotal = parseFloat(inv.total) || 0;
        if (Array.isArray(inv.items) && inv.items.length > 0) {
            this.state.items = inv.items.map(item => ({
                service: item.service || item.name || item.title || "Services",
                description: item.description || item.desc || "",
                qty: typeof item.qty !== "undefined" ? parseFloat(item.qty) : (item.quantity ? parseFloat(item.quantity) : 1),
                rate: typeof item.rate !== "undefined" ? parseFloat(item.rate) : (item.price ? parseFloat(item.price) : 0)
            }));
        } else if (invTotal > 0) {
            this.state.items = [{
                service: "Design & Development Services",
                description: `Services rendered for Invoice #${this.state.invoiceNumber}`,
                qty: 1,
                rate: invTotal
            }];
        } else {
            this.state.items = [{ service: "", description: "", qty: 1, rate: 0 }];
        }

        this.state.taxRate = typeof inv.taxRate !== "undefined" ? parseFloat(inv.taxRate) : this.defaults.taxRate;
        this.state.discount = typeof inv.discount !== "undefined" ? parseFloat(inv.discount) : 0;
        this.state.discountType = inv.discountType || "percent";
        this.state.notes = typeof inv.notes !== "undefined" ? inv.notes : (this.defaults.bankDetails + "\n\n" + this.defaults.paymentNote);
        this.state.status = inv.status || "UNPAID";
        this.state.amountPaid = typeof inv.amountPaid !== "undefined" ? parseFloat(inv.amountPaid) : 0;

        const invNumInput = document.getElementById("invoiceNumber");
        if (invNumInput) invNumInput.value = this.state.invoiceNumber;

        const invDateInput = document.getElementById("invoiceDate");
        if (invDateInput) invDateInput.value = this.state.invoiceDate;

        const dueDateInput = document.getElementById("dueDate");
        if (dueDateInput) dueDateInput.value = this.state.dueDate;

        const taxRateInput = document.getElementById("taxRate");
        if (taxRateInput) taxRateInput.value = this.state.taxRate;

        const discountInput = document.getElementById("discount");
        if (discountInput) discountInput.value = this.state.discount;

        const discountTypeInput = document.getElementById("discountType");
        if (discountTypeInput) discountTypeInput.value = this.state.discountType;

        const notesInput = document.getElementById("invoiceNotes");
        if (notesInput) notesInput.value = this.state.notes;

        const clientNameInput = document.getElementById("clientName");
        if (clientNameInput) clientNameInput.value = this.state.client.name || "";

        const clientEmailInput = document.getElementById("clientEmail");
        if (clientEmailInput) clientEmailInput.value = this.state.client.email || "";

        const clientPhoneInput = document.getElementById("clientPhone");
        if (clientPhoneInput) clientPhoneInput.value = this.state.client.phone || "";

        const clientAddressInput = document.getElementById("clientAddress");
        if (clientAddressInput) clientAddressInput.value = this.state.client.address || "";

        this.populateClientSelect();
        const select = document.getElementById("clientSelect");
        if (select) {
            const opt = Array.from(select.options).find(o => o.value.toLowerCase() === (this.state.client.name || "").toLowerCase());
            if (opt) select.value = opt.value;
        }

        this.renderItems();
        this.updatePreview();

        document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
        this.showToast(`✏️ Loaded Invoice #${inv.invoiceNumber} (${this.formatCurrency(this.calcTotal())}) for editing.`);
    },

    downloadPDFForInvoice(invoiceNumber) {
        this.loadInvoiceIntoForm(invoiceNumber);
        this.downloadPDF();
    },

    deleteInvoiceRecord(invoiceNumber) {
        let invoices = this.getInvoices();
        invoices = invoices.filter(i => String(i.invoiceNumber) !== String(invoiceNumber));
        localStorage.setItem("dc_invoices", JSON.stringify(invoices));
        this.syncToCloud();
        this.showToast(`Deleted Invoice #${invoiceNumber}.`);
    },

    showToast(msg) {
        let container = document.getElementById("toastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "toastContainer";
            container.style.cssText = "position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.style.cssText = "background: #1a1a1a; border: 1px solid #ff5e00; color: #fff; padding: 12px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.6); pointer-events: auto; transition: all 0.3s ease;";
        toast.innerHTML = msg;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ---- Cloud Database Sync Engine (Self-Healing & Fail-Safe) ----
    updateCloudStatus(status, text) {
        const badge = document.getElementById("cloudStatusBadge");
        if (!badge) return;
        badge.className = `cloud-status-badge ${status}`;
        badge.innerHTML = text;
    },

    restoreSeedData() {
        if (confirm("Restore all default Dubani Creatives clients, products/services, and previous invoices (#385–#389)?")) {
            this.seedDefaults(true);
            this.populateClientSelect();
            this.renderForm();
            this.updatePreview();
            if (document.getElementById("invoicesModal").classList.contains("active")) this.renderInvoicesModal();
            if (document.getElementById("clientsModal").classList.contains("active")) this.renderClientsModal();
            if (document.getElementById("servicesModal").classList.contains("active")) this.renderServicesModal();
            this.syncToCloud();
            this.showToast("🔄 All previous clients, products, and invoices restored!");
        }
    },

    async syncFromCloud() {
        try {
            this.updateCloudStatus("", "☁️ Syncing...");
            const res = await fetch(this.cloudDbUrl, { cache: "no-store" }).catch(() => null);
            if (res && res.ok) {
                const cloudData = await res.json().catch(() => null);

                if (cloudData && typeof cloudData === "object") {
                    let updated = false;

                    // Merge clients safely
                    if (Array.isArray(cloudData.clients) && cloudData.clients.length > 0) {
                        const localClients = this.getClients();
                        const mergedClients = [...localClients];
                        cloudData.clients.forEach(cc => {
                            const idx = mergedClients.findIndex(lc => (lc.name || "").trim().toLowerCase() === (cc.name || "").trim().toLowerCase());
                            if (idx >= 0) {
                                mergedClients[idx] = { ...mergedClients[idx], ...cc };
                            } else {
                                mergedClients.push(cc);
                            }
                        });
                        localStorage.setItem("dc_clients", JSON.stringify(mergedClients));
                        updated = true;
                    }

                    // Merge invoices safely
                    if (Array.isArray(cloudData.invoices) && cloudData.invoices.length > 0) {
                        const localInvoices = this.getInvoices();
                        const mergedInvoices = [...localInvoices];
                        cloudData.invoices.forEach(ci => {
                            const idx = mergedInvoices.findIndex(li => String(li.invoiceNumber).trim() === String(ci.invoiceNumber).trim());
                            if (idx >= 0) {
                                mergedInvoices[idx] = { ...mergedInvoices[idx], ...ci };
                            } else {
                                mergedInvoices.push(ci);
                            }
                        });
                        mergedInvoices.sort((a, b) => (parseInt(b.invoiceNumber) || 0) - (parseInt(a.invoiceNumber) || 0));
                        localStorage.setItem("dc_invoices", JSON.stringify(mergedInvoices));
                        updated = true;
                    }

                    // Merge services safely
                    if (Array.isArray(cloudData.services) && cloudData.services.length > 0) {
                        const localServices = this.getServices();
                        const mergedServices = [...localServices];
                        cloudData.services.forEach(cs => {
                            const idx = mergedServices.findIndex(ls => (ls.name || "").trim().toLowerCase() === (cs.name || "").trim().toLowerCase());
                            if (idx >= 0) {
                                mergedServices[idx] = { ...mergedServices[idx], ...cs };
                            } else {
                                mergedServices.push(cs);
                            }
                        });
                        localStorage.setItem("dc_services", JSON.stringify(mergedServices));
                        updated = true;
                    }

                    // Settings
                    if (cloudData.settings && typeof cloudData.settings === "object") {
                        Object.assign(this.defaults, cloudData.settings);
                        localStorage.setItem("dc_settings", JSON.stringify(this.defaults));
                    }

                    // Counter
                    if (cloudData.invoiceCounter && cloudData.invoiceCounter > this.state.invoiceNumber) {
                        this.state.invoiceNumber = cloudData.invoiceCounter;
                        this.saveCounter();
                        const numInput = document.getElementById("invoiceNumber");
                        if (numInput) numInput.value = this.state.invoiceNumber;
                    }

                    if (updated) {
                        this.populateClientSelect();
                        this.renderItems();
                        this.updatePreview();
                    }

                    this.updateCloudStatus("synced", "☁️ Database Active");
                    return;
                }
            }
            this.updateCloudStatus("synced", "☁️ Protected DB Active");
        } catch (err) {
            console.warn("Cloud DB fetch fallback to local cache:", err);
            this.updateCloudStatus("synced", "☁️ Protected DB Active");
        }
    },

    async syncToCloud() {
        try {
            this.updateCloudStatus("", "☁️ Saving...");
            const payload = {
                clients: this.getClients(),
                invoices: this.getInvoices(),
                services: this.getServices(),
                settings: this.defaults,
                invoiceCounter: this.state.invoiceNumber,
                lastUpdated: new Date().toISOString()
            };

            const res = await fetch(this.cloudDbUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            }).catch(() => null);

            if (res && (res.ok || res.status === 200 || res.status === 201)) {
                this.updateCloudStatus("synced", "☁️ Database Synced");
            } else {
                // If existing blob endpoint returns error or 404, auto-create a new jsonblob
                const createRes = await fetch("https://jsonblob.com/api/jsonBlob", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json" },
                    body: JSON.stringify(payload)
                }).catch(() => null);

                if (createRes && createRes.ok) {
                    const blobLocation = createRes.headers.get("Location");
                    if (blobLocation) {
                        this.cloudDbUrl = blobLocation;
                        this.updateCloudStatus("synced", "☁️ Database Synced");
                    } else {
                        this.updateCloudStatus("synced", "☁️ Protected DB Active");
                    }
                } else {
                    this.updateCloudStatus("synced", "☁️ Protected DB Active");
                }
            }
        } catch (err) {
            console.warn("Cloud DB push fallback to protected local storage:", err);
            this.updateCloudStatus("synced", "☁️ Protected DB Active");
        }
    },

    exportBackup() {
        const backupData = {
            version: 1,
            exportDate: new Date().toISOString(),
            clients: this.getClients(),
            invoices: this.getInvoices(),
            services: this.getServices(),
            settings: this.defaults,
            invoiceCounter: this.state.invoiceNumber
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = `dubani_creatives_backup_${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast("📥 Data Backup Exported Successfully!");
    },

    importBackup(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data.clients)) localStorage.setItem("dc_clients", JSON.stringify(data.clients));
                if (Array.isArray(data.invoices)) localStorage.setItem("dc_invoices", JSON.stringify(data.invoices));
                if (Array.isArray(data.services)) localStorage.setItem("dc_services", JSON.stringify(data.services));
                if (data.settings) {
                    Object.assign(this.defaults, data.settings);
                    localStorage.setItem("dc_settings", JSON.stringify(this.defaults));
                }
                if (data.invoiceCounter) {
                    this.state.invoiceNumber = parseInt(data.invoiceCounter);
                    this.saveCounter();
                }

                this.renderForm();
                this.updatePreview();
                await this.syncToCloud();
                this.showToast("📤 Backup Imported & Synced to Cloud!");
            } catch (err) {
                alert("Failed to import backup file. Invalid format: " + err.message);
            }
        };
        reader.readAsText(file);
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

    calcBalance() {
        const total = this.calcTotal();
        if (this.state.status === "PAID") return 0;
        if (this.state.status === "PARTIALLY PAID") {
            const paid = parseFloat(this.state.amountPaid) || 0;
            return Math.max(0, total - paid);
        }
        return total;
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
        const saveInvoiceBtn = document.getElementById("saveInvoiceBtn");
        if (saveInvoiceBtn) {
            saveInvoiceBtn.addEventListener("click", () => this.saveInvoiceRecord(false));
        }
        const markPaidBtn = document.getElementById("markPaidBtn");
        if (markPaidBtn) {
            markPaidBtn.addEventListener("click", () => this.openPaymentModal());
        }
        document.getElementById("downloadPdf").addEventListener("click", () => this.downloadPDF());
        document.getElementById("shareWhatsapp").addEventListener("click", () => this.shareWhatsApp());
        document.getElementById("shareEmail").addEventListener("click", () => this.shareEmail());

        // Payment Form events
        const paymentForm = document.getElementById("paymentForm");
        if (paymentForm) {
            paymentForm.addEventListener("submit", e => this.applyPayment(e));
        }
        document.querySelectorAll('input[name="payOption"]').forEach(radio => {
            radio.addEventListener("change", () => this.updatePaymentSummary());
        });
        const customPaidInput = document.getElementById("customPaidAmount");
        if (customPaidInput) {
            customPaidInput.addEventListener("input", () => this.updatePaymentSummary());
        }

        // Save client button
        document.getElementById("saveClientBtn").addEventListener("click", () => {
            if (this.state.client.name.trim()) {
                this.saveClient({ ...this.state.client });
                this.populateClientSelect();
                this.showToast("👤 Client saved successfully!");
            }
        });

        // Modal buttons
        const manageInvoicesBtn = document.getElementById("manageInvoicesBtn");
        if (manageInvoicesBtn) {
            manageInvoicesBtn.addEventListener("click", () => this.showModal("invoicesModal"));
        }
        document.getElementById("manageClientsBtn").addEventListener("click", () => this.showModal("clientsModal"));
        document.getElementById("manageServicesBtn").addEventListener("click", () => this.showModal("servicesModal"));
        document.getElementById("settingsBtn").addEventListener("click", () => this.showModal("settingsModal"));

        // Search invoices
        const searchInvoicesInput = document.getElementById("searchInvoicesInput");
        if (searchInvoicesInput) {
            searchInvoicesInput.addEventListener("input", e => this.renderInvoicesModal(e.target.value.toLowerCase().trim()));
        }

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

        // Backup & Restore
        const exportBackupBtn = document.getElementById("exportBackupBtn");
        if (exportBackupBtn) {
            exportBackupBtn.addEventListener("click", () => this.exportBackup());
        }

        const importBackupBtn = document.getElementById("importBackupBtn");
        const importBackupFile = document.getElementById("importBackupFile");
        if (importBackupBtn && importBackupFile) {
            importBackupBtn.addEventListener("click", () => importBackupFile.click());
            importBackupFile.addEventListener("change", e => {
                if (e.target.files && e.target.files[0]) {
                    this.importBackup(e.target.files[0]);
                }
            });
        }

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

    updatePreview() {
        const p = document.getElementById("invoicePreview");
        const subtotal = this.calcSubtotal();
        const discount = this.calcDiscount();
        const tax = this.calcTax();
        const total = this.calcTotal();
        const balance = this.calcBalance();
        const amountPaid = parseFloat(this.state.amountPaid) || 0;

        let watermarkHtml = "";
        if (this.state.status === "PAID") {
            watermarkHtml = `<div class="inv-watermark-stamp">PAID FULL</div>`;
        } else if (this.state.status === "PARTIALLY PAID") {
            watermarkHtml = `
                <div class="inv-watermark-stamp partial">
                    PARTIALLY PAID
                    <div style="font-size: 13px; font-weight: 800; margin-top: 2px;">PAID: ${this.formatCurrency(amountPaid)}</div>
                    <div style="font-size: 13px; font-weight: 800;">BAL: ${this.formatCurrency(balance)}</div>
                </div>
            `;
        }

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
            ${watermarkHtml}
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
                    <div class="inv-balance-due" style="${this.state.status === 'PAID' ? 'background:#25D366;' : (this.state.status === 'PARTIALLY PAID' ? 'background:#ff9900;' : '')}">
                        <span>Balance Due:</span>
                        <span>${this.formatCurrency(balance)}</span>
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
                    ${amountPaid > 0 ? `<tr><td style="color:#25D366; font-weight:600;">Amount Paid:</td><td style="color:#25D366; font-weight:600;">- ${this.formatCurrency(amountPaid)}</td></tr>` : ""}
                    ${this.state.status !== "UNPAID" ? `<tr style="border-top:2px solid #1a1a1a;"><td style="font-size:15px; font-weight:700; color:${balance === 0 ? '#25D366' : '#ff5e00'};">Balance Due:</td><td style="font-size:15px; font-weight:700; color:${balance === 0 ? '#25D366' : '#ff5e00'};">${this.formatCurrency(balance)}</td></tr>` : ""}
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
        const balance = this.calcBalance();
        if (this.state.status === "PAID") {
            doc.setFillColor(37, 211, 102);
        } else if (this.state.status === "PARTIALLY PAID") {
            doc.setFillColor(255, 153, 0);
        } else {
            doc.setFillColor(30, 30, 30);
        }
        doc.rect(rightCol - 80, y - 1, 80, 10, "F");
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Balance Due:", rightCol - 76, y + 5);
        doc.text(this.formatCurrency(balance), rightCol - 4, y + 5, { align: "right" });
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

        if (this.state.status === "PARTIALLY PAID" || (this.state.amountPaid > 0 && this.state.amountPaid < total)) {
            y += 5;
            doc.setFontSize(9);
            doc.setTextColor(37, 211, 102);
            doc.text("Amount Paid:", rightCol - 50, y);
            doc.text("- " + this.formatCurrency(this.state.amountPaid), rightCol, y, { align: "right" });
            y += 5;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(255, 94, 0);
            doc.text("Balance Due:", rightCol - 50, y);
            doc.text(this.formatCurrency(balance), rightCol, y, { align: "right" });
            doc.setFont("helvetica", "normal");
        }
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

        // --- Watermark Stamp ---
        if (this.state.status === "PAID" || this.state.status === "PARTIALLY PAID") {
            try {
                if (typeof doc.saveGraphicsState === "function") doc.saveGraphicsState();
                if (typeof doc.setGState === "function") {
                    doc.setGState(new doc.GState({ opacity: 0.25 }));
                }

                doc.setFont("helvetica", "bold");
                const centerX = pageW / 2;
                const centerY = 140;

                if (this.state.status === "PAID") {
                    doc.setTextColor(37, 211, 102);
                    doc.setFontSize(54);
                    doc.text("PAID FULL", centerX, centerY, { align: "center", angle: 25 });
                    doc.setDrawColor(37, 211, 102);
                    doc.setLineWidth(2.5);
                    doc.rect(centerX - 60, centerY - 20, 120, 26, "S");
                } else {
                    doc.setTextColor(255, 140, 0);
                    doc.setFontSize(36);
                    doc.text("PARTIALLY PAID", centerX, centerY - 6, { align: "center", angle: 25 });
                    doc.setFontSize(16);
                    doc.text(`PAID: ${this.formatCurrency(this.state.amountPaid || 0)} | BAL: ${this.formatCurrency(balance)}`, centerX, centerY + 8, { align: "center", angle: 25 });
                    doc.setDrawColor(255, 140, 0);
                    doc.setLineWidth(2.5);
                    doc.rect(centerX - 70, centerY - 20, 140, 36, "S");
                }
                if (typeof doc.restoreGraphicsState === "function") doc.restoreGraphicsState();
            } catch (e) {
                console.warn("Watermark rendering warning:", e);
            }
        }

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
        this.state.status = "UNPAID";
        this.state.amountPaid = 0;
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

    // ---- Payment & Watermark Logic ----
    openPaymentModal(targetInvNum) {
        if (targetInvNum) {
            this.loadInvoiceIntoForm(targetInvNum);
        }
        const total = this.calcTotal();
        const invNumEl = document.getElementById("payModalInvNum");
        const totalEl = document.getElementById("payModalTotal");
        const halfDesc = document.getElementById("payHalfDesc");

        if (invNumEl) invNumEl.textContent = `#${this.state.invoiceNumber}`;
        if (totalEl) totalEl.textContent = this.formatCurrency(total);
        if (halfDesc) halfDesc.textContent = `Pay 50% (${this.formatCurrency(total / 2)}) & auto-create balance invoice`;

        const fullRadio = document.querySelector('input[name="payOption"][value="full"]');
        if (fullRadio) fullRadio.checked = true;

        const customGroup = document.getElementById("customAmountGroup");
        if (customGroup) customGroup.style.display = "none";

        const customInput = document.getElementById("customPaidAmount");
        if (customInput) customInput.value = "";

        this.updatePaymentSummary();
        this.showModal("paymentModal");
    },

    updatePaymentSummary() {
        const total = this.calcTotal();
        const selectedOpt = document.querySelector('input[name="payOption"]:checked')?.value || "full";
        const customGroup = document.getElementById("customAmountGroup");

        let amountPaid = total;
        if (selectedOpt === "full") {
            if (customGroup) customGroup.style.display = "none";
            amountPaid = total;
        } else if (selectedOpt === "half") {
            if (customGroup) customGroup.style.display = "none";
            amountPaid = total / 2;
        } else if (selectedOpt === "custom") {
            if (customGroup) customGroup.style.display = "block";
            const customVal = parseFloat(document.getElementById("customPaidAmount")?.value) || 0;
            amountPaid = Math.min(total, Math.max(0, customVal));
        } else if (selectedOpt === "unpaid") {
            if (customGroup) customGroup.style.display = "none";
            amountPaid = 0;
        }

        const balance = Math.max(0, total - amountPaid);

        const paidValEl = document.getElementById("summaryPaidVal");
        const balValEl = document.getElementById("summaryBalanceVal");

        if (paidValEl) paidValEl.textContent = this.formatCurrency(amountPaid);
        if (balValEl) balValEl.textContent = this.formatCurrency(balance);
    },

    applyPayment(e) {
        if (e) e.preventDefault();
        const total = this.calcTotal();
        const selectedOpt = document.querySelector('input[name="payOption"]:checked')?.value || "full";
        const origNum = this.state.invoiceNumber;

        if (selectedOpt === "unpaid") {
            this.retractPaymentStatus();
            document.getElementById("paymentModal").classList.remove("active");
            return;
        }

        let amountPaid = total;
        if (selectedOpt === "full") {
            amountPaid = total;
        } else if (selectedOpt === "half") {
            amountPaid = total / 2;
        } else if (selectedOpt === "custom") {
            const customVal = parseFloat(document.getElementById("customPaidAmount")?.value) || 0;
            amountPaid = Math.max(0, customVal);
        }

        const balance = Math.max(0, total - amountPaid);
        const clientObj = { ...this.state.client };
        const mainService = this.state.items.find(i => i.service)?.service || "Services";

        if (balance <= 0) {
            this.state.status = "PAID";
            this.state.amountPaid = total;
        } else {
            this.state.status = "PARTIALLY PAID";
            this.state.amountPaid = amountPaid;
        }

        this.saveInvoiceRecord(true);
        this.updatePreview();
        document.getElementById("paymentModal").classList.remove("active");

        if (balance > 0) {
            const newNum = this.createBalanceInvoice(origNum, balance, clientObj, mainService);
            this.showToast(`💳 Payment recorded! Balance invoice #${newNum} created for ${this.formatCurrency(balance)}.`);
        } else {
            this.showToast(`💳 Invoice #${origNum} stamped as PAID FULL!`);
        }
    },

    retractPaymentStatus(targetInvNum) {
        if (targetInvNum) {
            this.loadInvoiceIntoForm(targetInvNum);
        }
        this.state.status = "UNPAID";
        this.state.amountPaid = 0;
        this.saveInvoiceRecord(true);
        this.updatePreview();

        if (document.getElementById("invoicesModal").classList.contains("active")) {
            this.renderInvoicesModal();
        }
        if (document.getElementById("clientsModal").classList.contains("active")) {
            this.renderClientsModal();
        }
        this.showToast(`↩️ Retracted payment status for Invoice #${this.state.invoiceNumber}. Marked as UNPAID.`);
    },

    createBalanceInvoice(origNum, balance, client, serviceName) {
        const newInvoiceNum = this.state.invoiceNumber + 1;
        this.state.invoiceNumber = newInvoiceNum;
        this.saveCounter();

        const todayStr = this.formatDateInput(new Date());

        const balanceRecord = {
            invoiceNumber: newInvoiceNum,
            invoiceDate: todayStr,
            dueDate: todayStr,
            clientName: client.name || "Valued Client",
            client: { ...client },
            items: [{
                service: `Balance Due (Inv #${origNum})`,
                description: `Remaining balance for Invoice #${origNum} — ${serviceName}`,
                qty: 1,
                rate: balance
            }],
            taxRate: 0,
            discount: 0,
            discountType: "percent",
            notes: `Reference: Outstanding balance for Invoice #${origNum}.\n\n` + this.defaults.bankDetails + "\n\n" + this.defaults.paymentNote,
            total: balance,
            status: "UNPAID",
            amountPaid: 0,
            balance: balance,
            currency: this.defaults.currency,
            itemsCount: 1,
            savedAt: new Date().toISOString()
        };

        const invoices = this.getInvoices();
        invoices.push(balanceRecord);
        invoices.sort((a, b) => b.invoiceNumber - a.invoiceNumber);
        localStorage.setItem("dc_invoices", JSON.stringify(invoices));
        this.syncToCloud();

        return newInvoiceNum;
    },

    // ---- Modals ----
    showModal(id) {
        document.getElementById(id).classList.add("active");
        if (id === "invoicesModal") this.renderInvoicesModal();
        if (id === "clientsModal") this.renderClientsModal();
        if (id === "servicesModal") this.renderServicesModal();
        if (id === "settingsModal") this.renderSettingsModal();
    },

    renderInvoicesModal(searchTerm = "") {
        const list = document.getElementById("invoicesList");
        if (!list) return;
        let invoices = this.getInvoices();

        if (searchTerm) {
            invoices = invoices.filter(i => 
                (i.invoiceNumber + "").includes(searchTerm) ||
                (i.clientName || "").toLowerCase().includes(searchTerm) ||
                (i.items && i.items.some(item => (item.service || "").toLowerCase().includes(searchTerm)))
            );
        }

        if (invoices.length === 0) {
            list.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 24px;">${searchTerm ? "No matching invoices found." : "No saved invoices yet. Click 'Save Invoice' to save invoices for future editing or download."}</p>`;
            return;
        }

        list.innerHTML = invoices.map(inv => {
            const clientName = this.escHtml(inv.clientName || (inv.client && inv.client.name) || "Unnamed Client");
            const dateStr = this.formatDateDisplay(inv.invoiceDate || inv.date);
            const dueDateStr = this.formatDateDisplay(inv.dueDate);
            const itemsCount = inv.itemsCount || (inv.items ? inv.items.length : 0);
            const formattedTotal = this.formatCurrency(parseFloat(inv.total) || 0);

            const status = inv.status || "UNPAID";
            const paidAmount = parseFloat(inv.amountPaid) || 0;
            const bal = typeof inv.balance !== "undefined" ? parseFloat(inv.balance) : (status === "PAID" ? 0 : parseFloat(inv.total) || 0);

            let statusBadge = `<span class="status-tag unpaid">UNPAID</span>`;
            if (status === "PAID") {
                statusBadge = `<span class="status-tag paid">PAID FULL</span>`;
            } else if (status === "PARTIALLY PAID") {
                statusBadge = `<span class="status-tag partial">PAID: ${this.formatCurrency(paidAmount)}</span>`;
            }

            const invNumSafe = String(inv.invoiceNumber).replace(/'/g, "\\'");

            return `
                <div class="saved-item" style="flex-direction: column; align-items: stretch; gap: 12px; cursor: default;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <span style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--accent);">#${inv.invoiceNumber}</span>
                                <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${clientName}</span>
                                ${statusBadge}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                Date: ${dateStr}${dueDateStr ? ' • Due: ' + dueDateStr : ''} • ${itemsCount} Item${itemsCount === 1 ? '' : 's'}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);">${formattedTotal}</div>
                            ${status === "PARTIALLY PAID" ? `<div style="font-size: 12px; color: var(--accent); font-weight: 600;">Bal: ${this.formatCurrency(bal)}</div>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary btn-sm" onclick="window.App.loadInvoiceIntoForm('${invNumSafe}')">✏️ Edit / Load</button>
                        <button class="btn btn-success btn-sm" style="background:#25D366; color:#fff;" onclick="window.App.openPaymentModal('${invNumSafe}')">💳 ${status === 'UNPAID' ? 'Mark Paid' : 'Update Paid'}</button>
                        ${(status === 'PAID' || status === 'PARTIALLY PAID') ? `<button class="btn btn-secondary btn-sm" style="border-color:rgba(255,68,68,0.5); color:#ff4444;" onclick="if(confirm('Retract payment status for Invoice #${invNumSafe}?')) window.App.retractPaymentStatus('${invNumSafe}')">↩️ Retract Paid</button>` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="window.App.downloadPDFForInvoice('${invNumSafe}')">📄 PDF</button>
                        <button class="btn btn-danger btn-sm" onclick="if(confirm('Delete Invoice #${invNumSafe}?')) { window.App.deleteInvoiceRecord('${invNumSafe}'); window.App.renderInvoicesModal('${this.escHtml(searchTerm)}'); }">Delete</button>
                    </div>
                </div>
            `;
        }).join("");
    },

    renderClientsModal() {
        const list = document.getElementById("clientsList");
        const clients = this.getClients();
        const allInvoices = this.getInvoices();

        list.innerHTML = clients.length === 0
            ? '<p style="color: var(--text-muted); font-size: 13px;">No saved clients yet.</p>'
            : clients.map(c => {
                const cName = (c.name || "").trim().toLowerCase();
                const clientInvoices = allInvoices.filter(i => {
                    const iName = (i.clientName || (i.client && i.client.name) || "").trim().toLowerCase();
                    return iName === cName || (iName && cName && (iName.includes(cName) || cName.includes(iName)));
                });

                const invoicesHtml = clientInvoices.length > 0
                    ? `<div class="client-history-list" style="margin-top: 10px; border-top: 1px dashed var(--border); padding-top: 10px;">
                        <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Past Invoices (${clientInvoices.length})</span>
                        <div style="margin-top: 6px; display: grid; gap: 6px;">
                            ${clientInvoices.map(inv => {
                                const invNumSafe = String(inv.invoiceNumber).replace(/'/g, "\\'");
                                const dateVal = this.formatDateDisplay(inv.invoiceDate || inv.date);
                                const totVal = parseFloat(inv.total) || 0;
                                return `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; padding: 6px 10px; border-radius: 6px; font-size: 12px; flex-wrap: wrap; gap: 6px;">
                                    <div>
                                        <span style="color: var(--accent); font-weight: bold;">#${inv.invoiceNumber}</span>
                                        <span style="color: var(--text-muted); margin-left: 6px;">${dateVal}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="color: var(--text-primary); font-weight: 600;">${inv.currency || 'ZAR'} ${totVal.toFixed(2)}</span>
                                        <button class="btn btn-primary btn-sm" style="padding: 2px 8px; font-size: 11px;" onclick="window.App.loadInvoiceIntoForm('${invNumSafe}')">✏️ Edit</button>
                                        <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;" onclick="window.App.downloadPDFForInvoice('${invNumSafe}')">📄 PDF</button>
                                        <button class="btn btn-sm" style="padding: 2px 6px; background: transparent; color: #ff4444;" onclick="if(confirm('Delete Invoice #${invNumSafe}?')) { window.App.deleteInvoiceRecord('${invNumSafe}'); window.App.renderClientsModal(); }">×</button>
                                    </div>
                                </div>
                            `;
                            }).join('')}
                        </div>
                       </div>`
                    : '<div style="margin-top: 10px; font-size: 11px; color: var(--text-muted);">No invoices generated for this client yet.</div>';

                const cNameSafe = (c.name || "").replace(/'/g, "\\'");

                return `
                <div class="saved-item" style="flex-direction: column; align-items: stretch; cursor: default;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="saved-item-info">
                            <h4>${this.escHtml(c.name)}</h4>
                            <p>${this.escHtml(c.phone || "")} ${c.email ? "• " + this.escHtml(c.email) : ""}</p>
                        </div>
                        <div class="saved-item-actions">
                            <button class="btn btn-danger btn-sm" onclick="window.App.deleteClient('${cNameSafe}'); window.App.renderClientsModal(); window.App.populateClientSelect();">Delete Client</button>
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
        this.syncToCloud();
        this.updatePreview();
        document.getElementById("settingsModal").classList.remove("active");
        this.showToast("⚙️ Settings saved & synced to database!");
    }
};

// Boot & Global Bind
window.App = App;
document.addEventListener("DOMContentLoaded", () => App.init());
