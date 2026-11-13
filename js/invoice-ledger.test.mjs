import test from "node:test";
import assert from "node:assert/strict";
import {
    MAX_FILE_BYTES,
    inspectUpload,
    storagePath,
    parseAmount,
    entryFromApp,
    entryFromUpload,
    invoiceTotal,
    enteredPaid,
    displayedPaid,
    payStatus,
    togglePlan,
    splitAmount,
    summarise,
    clientSummaries,
    isOverdueEntry,
    monthReceived,
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

test("amount paid is separate from the invoice total", () => {
    const issued = entryFromApp({
        id: "1",
        kind: "invoice",
        status: "sent",
        total: 2100,
        amount_paid: 0,
        client_id: "c1",
        clients: { name: "Gugulethu" },
    });
    assert.equal(invoiceTotal(issued), 2100);
    assert.equal(enteredPaid(issued), 0);
    assert.equal(payStatus(issued), "unpaid");
    assert.deepEqual(splitAmount(issued), { invoiced: 2100, paid: 0, outstanding: 2100 });

    const partial = entryFromApp({
        id: "1",
        kind: "invoice",
        status: "sent",
        total: 2100,
        amount_paid: 0,
        tracked_amount: 500,
        client_id: "c1",
    });
    assert.equal(invoiceTotal(partial), 2100);
    assert.equal(displayedPaid(partial), 500);
    assert.equal(payStatus(partial), "partial");
    assert.equal(splitAmount(partial).outstanding, 1600);

    const edited = entryFromApp({
        id: "1",
        kind: "invoice",
        status: "sent",
        total: 2100,
        tracked_amount: 1450,
        client_id: "c1",
    });
    assert.equal(displayedPaid(edited), 1450);
    assert.equal(splitAmount(edited).outstanding, 650);
});

test("paid toggle fills the total and clearing it keeps the typed amount", () => {
    const typed = entryFromApp({
        id: "2",
        kind: "invoice",
        status: "sent",
        total: 2100,
        tracked_amount: 500,
        marked_paid: false,
        client_id: "c1",
    });
    assert.deepEqual(togglePlan(typed), { action: "force", confirm: true });
    const forced = entryFromApp({
        id: "2",
        kind: "invoice",
        status: "sent",
        total: 2100,
        tracked_amount: 500,
        marked_paid: true,
        client_id: "c1",
    });
    assert.equal(enteredPaid(forced), 500);
    assert.equal(displayedPaid(forced), 2100);
    assert.equal(payStatus(forced), "paid");
    assert.equal(splitAmount(forced).outstanding, 0);
    assert.deepEqual(togglePlan(forced), { action: "clear", confirm: false });
    const cleared = entryFromApp({
        id: "2",
        kind: "invoice",
        status: "sent",
        total: 2100,
        tracked_amount: 500,
        marked_paid: false,
        client_id: "c1",
    });
    assert.equal(displayedPaid(cleared), 500);
    assert.equal(payStatus(cleared), "partial");

    const covered = entryFromApp({
        id: "3",
        kind: "invoice",
        status: "sent",
        total: 1000,
        tracked_amount: 1000,
        client_id: "c1",
    });
    assert.equal(payStatus(covered), "paid");
    assert.deepEqual(togglePlan(covered), { action: "already", confirm: false });
});

test("drafts, quotes, and void invoices stay out of the totals", () => {
    const rows = [
        entryFromApp({ id: "d", kind: "invoice", status: "draft", total: 500, client_id: "c1" }),
        entryFromApp({ id: "q", kind: "quote", status: "sent", total: 900, client_id: "c1" }),
        entryFromApp({ id: "v", kind: "invoice", status: "void", total: 700, client_id: "c1" }),
        entryFromApp({ id: "i", kind: "invoice", status: "sent", total: 300, amount_paid: 300, client_id: "c1" }),
    ];
    assert.deepEqual(summarise(rows), { invoiced: 300, paid: 300, outstanding: 0 });
});

test("uploads keep an editable total and a separate amount paid", () => {
    const upload = entryFromUpload({
        id: "u1",
        client_id: "c1",
        name: "old-invoice.pdf",
        amount: 1800,
        amount_paid: 500,
        paid: false,
        clients: { name: "Luzana" },
    });
    assert.equal(invoiceTotal(upload), 1800);
    assert.equal(displayedPaid(upload), 500);
    assert.equal(payStatus(upload), "partial");
    const forced = entryFromUpload({ id: "u2", client_id: "c2", name: "paid.jpg", amount: 80, amount_paid: 0, paid: true });
    assert.equal(enteredPaid(forced), 0);
    assert.equal(displayedPaid(forced), 80);
    assert.equal(payStatus(forced), "paid");
    const totals = summarise([
        entryFromApp({ id: "i", kind: "invoice", status: "sent", total: 100, tracked_amount: 40, client_id: "c1" }),
        upload,
        forced,
    ]);
    assert.deepEqual(totals, { invoiced: 1980, paid: 620, outstanding: 1360 });
    const byClient = clientSummaries([upload, forced], [
        { id: "c1", name: "Luzana", archived: false },
        { id: "c2", name: "FCI", archived: false },
        { id: "c3", name: "Old", archived: true },
    ]);
    assert.deepEqual(byClient.map((row) => row.client_name), ["FCI", "Luzana"]);
    assert.equal(byClient.find((row) => row.client_id === "c1").outstanding, 1300);
    assert.equal(monthReceived([400], [100, -50]), 450);
});

test("overdue ignores invoices the owner marked paid", () => {
    const open = entryFromApp({ id: "1", kind: "invoice", status: "sent", due_date: "2026-11-01", total: 10, client_id: "c" });
    assert.equal(isOverdueEntry(open, "2026-11-13"), true);
    const paid = entryFromApp({ id: "2", kind: "invoice", status: "sent", due_date: "2026-11-01", marked_paid: true, total: 10, client_id: "c" });
    assert.equal(isOverdueEntry(paid, "2026-11-13"), false);
    assert.equal(formatZar(2100), "ZAR 2,100.00");
});
