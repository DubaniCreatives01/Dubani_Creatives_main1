import test from "node:test";
import assert from "node:assert/strict";
import {
    MAX_FILE_BYTES,
    inspectUpload,
    expiryAlert,
    safeStorageName,
    storagePath,
    missingStarterFolders,
    canPreview,
    formatBytes,
    cleanFileName,
    STARTER_FOLDERS,
} from "./vault-logic.mjs";

test("accepts the required document types under the size limit", () => {
    for (const name of ["cipc.pdf", "logo.PNG", "tax.docx", "sheet.xlsx", "deck.pptx", "old.doc", "old.xls", "old.ppt", "pack.zip", "photo.jpeg", "anim.gif", "mark.webp"]) {
        const result = inspectUpload({ name, size: 1024 });
        assert.equal(result.ok, true, name);
        assert.equal(result.name, name);
    }
});

test("rejects empty files, oversize files, and other extensions", () => {
    assert.match(inspectUpload({ name: "notes.exe", size: 10 }).error, /not an allowed type/);
    assert.match(inspectUpload({ name: "empty.pdf", size: 0 }).error, /empty/);
    const over = inspectUpload({ name: "huge.pdf", size: MAX_FILE_BYTES + 1 });
    assert.equal(over.ok, false);
    assert.match(over.error, /50 MB/);
    assert.equal(inspectUpload({ name: "exact.pdf", size: MAX_FILE_BYTES }).ok, true);
});

test("storage names drop path characters", () => {
    assert.equal(safeStorageName("../../B-BBEE certificate 2027.pdf"), "B-BBEE_certificate_2027.pdf");
    assert.equal(storagePath("owner", "file", "a/b.pdf"), "owner/file/b.pdf");
});

test("expiry warnings use 30 and 60 day buckets", () => {
    const today = "2026-11-13";
    assert.equal(expiryAlert(null, today), null);
    assert.equal(expiryAlert("2027-11-11", today), null);
    assert.equal(expiryAlert("2026-11-13", today).level, "soon");
    assert.equal(expiryAlert("2026-12-13", today).level, "soon");
    assert.equal(expiryAlert("2026-12-14", today).level, "upcoming");
    assert.equal(expiryAlert("2027-01-12", today).level, "upcoming");
    assert.equal(expiryAlert("2027-01-13", today), null);
    assert.equal(expiryAlert("2026-11-12", today).level, "expired");
    assert.match(expiryAlert("2026-11-01", today).label, /Expired 12 days ago/);
});

test("starter folders are only created when missing", () => {
    assert.deepEqual(missingStarterFolders([]).length, STARTER_FOLDERS.length);
    assert.deepEqual(missingStarterFolders(["b-bbee", "Banking"]), STARTER_FOLDERS.filter((name) => name !== "B-BBEE" && name !== "Banking"));
});

test("file names keep spaces and reject paths", () => {
    assert.equal(cleanFileName("  B-BBEE certificate.pdf "), "B-BBEE certificate.pdf");
    assert.equal(cleanFileName("../secret.pdf"), "");
    assert.equal(cleanFileName(""), "");
});

test("only pdf and images preview in the page", () => {
    assert.equal(canPreview("application/pdf"), true);
    assert.equal(canPreview("image/png"), true);
    assert.equal(canPreview("application/zip"), false);
    assert.equal(formatBytes(1536), "1.5 KB");
});
