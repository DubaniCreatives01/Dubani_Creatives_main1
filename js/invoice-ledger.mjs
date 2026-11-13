/** Pure rules for the owner invoice ledger. No network, no DOM. */

export const BUCKET = "invoice-uploads";
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const SIGNED_URL_SECONDS = 120;

export const ALLOWED_EXTENSIONS = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
};

const PREVIEWABLE = new Set(Object.values(ALLOWED_EXTENSIONS));

export function extensionOf(name) {
    const base = String(name || "").split(/[/\\]/).pop() || "";
    const dot = base.lastIndexOf(".");
    if (dot <= 0 || dot === base.length - 1) return "";
    return base.slice(dot + 1).toLowerCase();
}

export function formatBytes(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n < 0) return "0 B";
    if (n < 1024) return `${Math.round(n)} B`;
    if (n < 1024 * 1024) {
        const kb = n / 1024;
        return `${kb >= 10 ? kb.toFixed(0) : kb.toFixed(1)} KB`;
    }
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function cleanUploadName(name) {
    const cleaned = String(name || "").replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim();
    if (!cleaned || cleaned.length > 200 || /[\\/]/.test(cleaned)) return "";
    return cleaned;
}

export function inspectUpload(file) {
    const name = cleanUploadName(file?.name);
    const size = Number(file?.size);
    if (!name) return { ok: false, error: "That file needs a simple file name, without folders." };
    if (!Number.isFinite(size) || size <= 0) return { ok: false, error: `${name} is empty.` };
    if (size > MAX_FILE_BYTES) {
        return { ok: false, error: `${name} is ${formatBytes(size)}. The limit is 20 MB per file.` };
    }
    const ext = extensionOf(name);
    const mime = ALLOWED_EXTENSIONS[ext];
    if (!mime) {
        return { ok: false, error: `${name} is not an allowed type. Use a PDF or an image (JPG, PNG, GIF, WEBP).` };
    }
    return { ok: true, name, size, ext, mime };
}

export function safeStorageName(name) {
    const base = String(name || "file").split(/[/\\]/).pop().trim() || "file";
    const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120);
    return cleaned || "file";
}

export function storagePath(ownerId, clientId, fileId, name) {
    return `${ownerId}/${clientId}/${fileId}/${safeStorageName(name)}`;
}

export function canPreview(mime) {
    return PREVIEWABLE.has(mime);
}

export function isPdf(mime) {
    return mime === "application/pdf";
}

export function round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

export function formatZar(amount) {
    const [whole, frac] = round2(amount).toFixed(2).split(".");
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `ZAR ${withCommas}.${frac}`;
}

/** Blank is allowed when the caller treats an empty field as zero or "no override". */
export function parseAmount(value, allowBlank) {
    const text = String(value ?? "").trim().replace(/,/g, "");
    if (!text) {
        if (allowBlank) return { ok: true, amount: null };
        return { ok: false, error: "Enter an amount." };
    }
    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
        return { ok: false, error: "Use a number with up to 2 decimal places." };
    }
    const amount = round2(text);
    if (amount > 100000000) return { ok: false, error: "That amount is too large." };
    return { ok: true, amount };
}

export function entryFromApp(row) {
    let marked = null;
    if (row?.marked_paid === true) marked = true;
    else if (row?.marked_paid === false) marked = false;
    const tracked = row?.tracked_amount == null || row?.tracked_amount === ""
        ? null
        : round2(row.tracked_amount);
    return {
        source: "app",
        id: row.id,
        kind: row.kind,
        status: row.status,
        reference: row.reference || "",
        number: row.number,
        title: row.title || "",
        issue_date: row.issue_date || "",
        due_date: row.due_date || "",
        created_at: row.created_at || "",
        client_id: row.client_id || "",
        client_name: row.clients?.name || row.client_name || "No client",
        total: round2(row.total),
        amount_paid: round2(row.amount_paid),
        balance_due: round2(row.balance_due),
        tracked_amount: tracked,
        marked_paid: marked,
        entered_paid: tracked != null ? tracked : round2(row.amount_paid),
        forced_paid: marked === true,
        amount: round2(row.total),
        paid: marked === true,
        name: "",
        mime_type: "",
        storage_path: "",
        size_bytes: 0,
    };
}

export function entryFromUpload(row) {
    const total = round2(row?.amount);
    const entered = round2(row?.amount_paid);
    const forced = row?.paid === true;
    return {
        source: "upload",
        id: row.id,
        kind: "upload",
        status: forced ? "paid" : "unpaid",
        reference: row.name || "",
        number: null,
        title: row.name || "",
        name: row.name || "",
        issue_date: row.issue_date || "",
        due_date: "",
        created_at: row.created_at || "",
        client_id: row.client_id || "",
        client_name: row.clients?.name || row.client_name || "No client",
        total,
        amount_paid: entered,
        balance_due: round2(Math.max(0, total - (forced ? total : entered))),
        tracked_amount: null,
        marked_paid: forced ? true : null,
        entered_paid: entered,
        forced_paid: forced,
        amount: total,
        paid: forced,
        mime_type: row.mime_type || "",
        storage_path: row.storage_path || "",
        size_bytes: Number(row.size_bytes) || 0,
    };
}

/** Invoice total. App invoices use the calculated total. Uploads use their editable total. */
export function invoiceTotal(entry) {
    return round2(entry?.total);
}

/** Amount the client has paid, before a Paid toggle forces the full total. */
export function enteredPaid(entry) {
    return round2(entry?.entered_paid);
}

export function displayedPaid(entry) {
    if (entry?.forced_paid) return invoiceTotal(entry);
    return enteredPaid(entry);
}

/** @deprecated The old name meant "invoice total". It now means amount received. */
export function displayedAmount(entry) {
    return displayedPaid(entry);
}

export function payStatus(entry) {
    if (!entry || entry.kind === "quote") return "";
    if (entry.forced_paid) return "paid";
    const paid = displayedPaid(entry);
    const total = invoiceTotal(entry);
    if (paid <= 0) return "unpaid";
    if (paid < total) return "partial";
    return "paid";
}

export function isSettled(entry) {
    return payStatus(entry) === "paid";
}

/** What the Paid / Unpaid button should do. It never zeroes the typed amount. */
export function togglePlan(entry) {
    if (entry?.forced_paid) return { action: "clear", confirm: false };
    if (payStatus(entry) === "paid") return { action: "already", confirm: false };
    return { action: "force", confirm: displayedPaid(entry) < invoiceTotal(entry) };
}

export function monthReceived(paymentAmounts, eventDeltas) {
    const payments = (paymentAmounts || []).reduce((sum, value) => sum + round2(value), 0);
    const deltas = (eventDeltas || []).reduce((sum, value) => sum + round2(value), 0);
    return round2(payments + deltas);
}

export function countsInTotals(entry) {
    if (entry.source === "upload") return true;
    return entry.kind === "invoice" && entry.status !== "draft" && entry.status !== "void";
}

export function splitAmount(entry) {
    if (!countsInTotals(entry)) return { invoiced: 0, paid: 0, outstanding: 0 };
    const invoiced = invoiceTotal(entry);
    const paid = displayedPaid(entry);
    return { invoiced, paid, outstanding: round2(Math.max(0, invoiced - paid)) };
}

export function summarise(entries) {
    return (entries || []).reduce((sum, entry) => {
        const part = splitAmount(entry);
        sum.invoiced = round2(sum.invoiced + part.invoiced);
        sum.paid = round2(sum.paid + part.paid);
        sum.outstanding = round2(sum.outstanding + part.outstanding);
        return sum;
    }, { invoiced: 0, paid: 0, outstanding: 0 });
}

export function clientSummaries(entries, clients) {
    const map = new Map();
    (clients || []).forEach((client) => {
        map.set(client.id, {
            client_id: client.id,
            client_name: client.name || "No client",
            invoiced: 0,
            paid: 0,
            outstanding: 0,
            count: 0,
            archived: Boolean(client.archived),
        });
    });
    (entries || []).forEach((entry) => {
        if (!map.has(entry.client_id)) {
            map.set(entry.client_id, {
                client_id: entry.client_id,
                client_name: entry.client_name || "No client",
                invoiced: 0,
                paid: 0,
                outstanding: 0,
                count: 0,
                archived: false,
            });
        }
        if (!countsInTotals(entry)) return;
        const row = map.get(entry.client_id);
        const part = splitAmount(entry);
        row.invoiced = round2(row.invoiced + part.invoiced);
        row.paid = round2(row.paid + part.paid);
        row.outstanding = round2(row.outstanding + part.outstanding);
        row.count += 1;
    });
    return [...map.values()]
        .filter((row) => !row.archived || row.count > 0)
        .sort((a, b) => a.client_name.localeCompare(b.client_name));
}

export function isOverdueEntry(entry, today) {
    if (!entry || entry.source !== "app" || entry.kind !== "invoice") return false;
    if (isSettled(entry) || !countsInTotals(entry)) return false;
    return Boolean(entry.due_date) && String(entry.due_date) < String(today || "");
}

export function missingPaidEvents(error) {
    const text = `${error?.message || ""} ${error?.details || ""}`;
    if (error?.code === "PGRST205" || error?.code === "42P01") return true;
    return /invoice_paid_events/.test(text) && /schema cache|does not exist/i.test(text);
}

export function missingLedgerColumn(error) {
    const text = `${error?.message || ""} ${error?.details || ""}`;
    return error?.code === "42703" || error?.code === "PGRST204" || /tracked_amount|marked_paid/.test(text);
}

export function missingUploadsTable(error) {
    const text = `${error?.message || ""} ${error?.details || ""}`;
    if (error?.code === "PGRST205" || error?.code === "42P01") return true;
    return /invoice_uploads/.test(text) && /schema cache|does not exist/i.test(text);
}
