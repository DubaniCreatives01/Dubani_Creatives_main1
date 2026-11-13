/** Pure rules for the owner file vault. No network, no DOM. */

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const SIGNED_URL_SECONDS = 120;

export const STARTER_FOLDERS = [
    "Company Registration (CIPC)",
    "SARS & Tax",
    "B-BBEE",
    "Banking",
    "Tenders & CSD",
    "Contracts & Proposals",
    "Invoices & Finance",
    "Brand Assets",
    "Client Files",
];

/** Canonical Content-Type we send to Storage, keyed by extension. */
export const ALLOWED_EXTENSIONS = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    zip: "application/zip",
};

const PREVIEWABLE = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
]);

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
    if (n < 1024 * 1024 * 1024) {
        const mb = n / (1024 * 1024);
        return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
    }
    return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function inspectUpload(file) {
    const name = String(file?.name || "").trim();
    const size = Number(file?.size);
    if (!name) return { ok: false, error: "That file has no name." };
    if (!Number.isFinite(size) || size <= 0) {
        return { ok: false, error: `${name} is empty.` };
    }
    if (size > MAX_FILE_BYTES) {
        return {
            ok: false,
            error: `${name} is ${formatBytes(size)}. The limit is ${formatBytes(MAX_FILE_BYTES)} per file.`,
        };
    }
    const ext = extensionOf(name);
    const mime = ALLOWED_EXTENSIONS[ext];
    if (!mime) {
        return {
            ok: false,
            error: `${name} is not an allowed type. Use PDF, images (JPG, PNG, GIF, WEBP), Word, Excel, PowerPoint, or ZIP.`,
        };
    }
    return { ok: true, name, size, ext, mime };
}

export function safeStorageName(name) {
    const base = String(name || "file").split(/[/\\]/).pop().trim() || "file";
    const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120);
    return cleaned || "file";
}

export function storagePath(ownerId, fileId, name) {
    return `${ownerId}/${fileId}/${safeStorageName(name)}`;
}

export function saToday(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Johannesburg",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export function daysUntil(expiresOn, today) {
    const start = String(today || "").slice(0, 10);
    const end = String(expiresOn || "").slice(0, 10);
    const [y1, m1, d1] = start.split("-").map(Number);
    const [y2, m2, d2] = end.split("-").map(Number);
    if (![y1, m1, d1, y2, m2, d2].every((part) => Number.isInteger(part))) return null;
    const a = Date.UTC(y1, m1 - 1, d1);
    const b = Date.UTC(y2, m2 - 1, d2);
    return Math.round((b - a) / 86400000);
}

/** Warning for files already expired or expiring within 60 days. 30 days is "soon". */
export function expiryAlert(expiresOn, today) {
    if (!expiresOn) return null;
    const days = daysUntil(expiresOn, today);
    if (days == null) return null;
    if (days < 0) {
        const n = Math.abs(days);
        return { level: "expired", days, label: `Expired ${n} day${n === 1 ? "" : "s"} ago` };
    }
    if (days === 0) return { level: "soon", days, label: "Expires today" };
    if (days <= 30) return { level: "soon", days, label: `Expires in ${days} day${days === 1 ? "" : "s"}` };
    if (days <= 60) return { level: "upcoming", days, label: `Expires in ${days} days` };
    return null;
}

export function canPreview(mime) {
    return PREVIEWABLE.has(mime);
}

export function isPdf(mime) {
    return mime === "application/pdf";
}

export function displayDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-ZA", {
        timeZone: "Africa/Johannesburg",
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

export function cleanFolderName(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function cleanFileName(value) {
    const name = String(value || "").replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim();
    if (!name || name.length > 200 || /[\\/]/.test(name)) return "";
    return name;
}

export function missingStarterFolders(existingNames) {
    const have = new Set((existingNames || []).map((name) => String(name || "").trim().toLowerCase()));
    return STARTER_FOLDERS.filter((name) => !have.has(name.toLowerCase()));
}
