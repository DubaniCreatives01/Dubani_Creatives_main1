import test from "node:test";
import assert from "node:assert/strict";
import {
    MAX_FILE_BYTES,
    inspectUpload,
    storagePath,
    parseAmount,
    entryFromApp,
    entryFromUpload,
    displayedAmount,
    isSettled,
    splitAmount,
    summarise,
    clientSummaries,
    isOverdueEntry,
    formatZar,
} from "./invoice-ledger.mjs";

test("accepts invoice files and rejects everything else", () => {
    for (const name of ["invoice.pdf", "scan.PNG", "photo.jpg", "photo.jpeg", "mark.gif", "page.webp"]) {
        assert.equal(inspectUpload({ name, size: 2048 }).ok, true, name);
    }
    assert.match(inspectUpload({ name: "sheet.xlsx", size: 10 }).error, /not an allowed type/);
    assert.match(inspectUpload({ name: "empty.pdf", size: 0 }).error, /empty/);
    assert.match(inspectUpload({ name: "huge.pdf", size: MAX_FILE_BYTES + 1 }).error, /20 MB/);
    assert.equal(inspectUpload({ name: "exact.pdf", size: MAX_FILE_BYTES }).ok, true);
    assert.equal(inspectUpload({ name: "../secret.pdf", size: 10 }).ok, false);
});

test("storage paths stay under the owner and client", () => {
    assert.equal(
        storagePath("owner", "client", "file", "../../Old invoice 2024.pdf"),
        "owner/client/file/Old_invoice_2024.pdf",
    );
});

test("amounts allow a blank override only for app invoices", () => {
    assert.deepEqual(parseAmount("2,100.5", false), { ok: true, amount: 2100.5 });
    assert.equal(parseAmount("", true).amount, null);
    assert.match(parseAmount("", false).error, /Enter an amount/);
    assert.match(parseAmount("-5", false).error, /number/);
    assert.match(parseAmount("1.234", false).error, /2 decimal/);
});

test("app invoices keep the calculated total until an amount is saved", () => {
    const issued = entryFromApp({
        id: "1",
        kind: "invoice",
        status: "sent",
        total: 2100,
        amount_paid: 0,
        balance_due: 2100,
        client_id: "c1",
        clients: { name: "Gugulethu" },
    });
    assert.equal(displayedAmount(issued), 2100);
    assert.equal(isSettled(issued), false);
    assert.deepEqual(splitAmount(issued), { invoiced: 2100, paid: 0, outstanding: 2100 });

    const overridden = entryFromApp({ ...issued, tracked_amount: 1800, clients: { name: "Gugulethu" }, kind: "invoice", status: "sent" });
    assert.equal(displayedAmount(overridden), 1800);
});

test("paid toggle overrides status without forgetting partial payments", () => {
    const partial = entryFromApp({
        id: "2",
        kind: "invoice",
        status: "partially_paid",
        total: 1000,
        amount_paid: 400,
        client_id: "c1",
    });
    assert.equal(isSettled(partial), false);
    assert.deepEqual(splitAmount(partial), { invoiced: 1000, paid: 400, outstanding: 600 });

    const forcedPaid = entryFromApp({ ...partial, marked_paid: true, kind: "invoice", status: "sent", total: 1000, amount_paid: 0 });
    assert.equal(isSettled(forcedPaid), true);
    assert.equal(splitAmount(forcedPaid).outstanding, 0);

    const forcedUnpaid = entryFromApp({ ...partial, marked_paid: false, kind: "invoice", status: "paid", total: 1000, amount_paid: 1000 });
    assert.equal(isSettled(forcedUnpaid), false);
    assert.equal(splitAmount(forcedUnpaid).outstanding, 1000);
});

test("drafts, quotes, and void invoices stay out of the totals", () => {
    const rows = [
        entryFromApp({ id: "d", kind: "invoice", status: "draft", total: 500, client_id: "c1" }),
        entryFromApp({ id: "q", kind: "quote", status: "sent", total: 900, client_id: "c1" }),
        entryFromApp({ id: "v", kind: "invoice", status: "void", total: 700, client_id: "c1" }),
        entryFromApp({ id: "i", kind: "invoice", status: "paid", total: 300, amount_paid: 300, client_id: "c1" }),
    ];
    assert.deepEqual(summarise(rows), { invoiced: 300, paid: 300, outstanding: 0 });
});

test("uploads sit beside app invoices for the same client", () => {
    const upload = entryFromUpload({
        id: "u1",
        client_id: "c1",
        name: "old-invoice.pdf",
        amount: 450,
        paid: false,
        clients: { name: "Luzana" },
    });
    const paidUpload = entryFromUpload({ id: "u2", client_id: "c2", name: "paid.jpg", amount: 80, paid: true });
    assert.equal(isSettled(upload), false);
    assert.equal(splitAmount(paidUpload).paid, 80);
    const totals = summarise([
        entryFromApp({ id: "i", kind: "invoice", status: "sent", total: 100, client_id: "c1", clients: { name: "Luzana" } }),
        upload,
        paidUpload,
    ]);
    assert.deepEqual(totals, { invoiced: 630, paid: 80, outstanding: 550 });
    const byClient = clientSummaries([upload, paidUpload], [
        { id: "c1", name: "Luzana", archived: false },
        { id: "c2", name: "FCI", archived: false },
        { id: "c3", name: "Old", archived: true },
    ]);
    assert.deepEqual(byClient.map((row) => row.client_name), ["FCI", "Luzana"]);
    assert.equal(byClient.find((row) => row.client_id === "c1").outstanding, 450);
});

test("overdue ignores invoices the owner marked paid", () => {
    const open = entryFromApp({ id: "1", kind: "invoice", status: "sent", due_date: "2026-11-01", total: 10, client_id: "c" });
    assert.equal(isOverdueEntry(open, "2026-11-13"), true);
    const paid = entryFromApp({ id: "2", kind: "invoice", status: "sent", due_date: "2026-11-01", marked_paid: true, total: 10, client_id: "c" });
    assert.equal(isOverdueEntry(paid, "2026-11-13"), false);
    assert.equal(formatZar(2100), "ZAR 2,100.00");
});
