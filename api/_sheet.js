/* Writes each order into a Google Sheet.
 *
 * Uses a Google Apps Script Web App rather than the Sheets API: a service
 * account would mean carrying a large private-key JSON in an environment
 * variable and pulling in the Google SDK, where this is one authenticated POST
 * with no dependency at all. The script belongs to the sheet's owner, so access
 * is revoked by deleting the deployment.
 *
 * Set in Vercel:
 *   SHEETS_WEBHOOK_URL     the /exec URL of the deployed Apps Script
 *   SHEETS_WEBHOOK_SECRET  a long random string, also set inside the script
 *
 * The secret matters because an Apps Script Web App deployed for "anyone" is a
 * public URL: without it, anyone who found the URL could write rows into the
 * order book.
 *
 * A sheet failure must never fail a payment. Every function here reports a
 * problem and returns false; the caller carries on. The notification email is
 * the backstop — an order recorded nowhere still reaches a person.
 */

const TIMEOUT_MS = 6000;

function configured() {
    return Boolean(process.env.SHEETS_WEBHOOK_URL && process.env.SHEETS_WEBHOOK_SECRET);
}

async function post(payload) {
    if (!configured()) return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const r = await fetch(process.env.SHEETS_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.assign({ secret: process.env.SHEETS_WEBHOOK_SECRET }, payload)),
            signal: ctrl.signal,
            redirect: "follow",          /* Apps Script answers via a redirect */
        });
        const text = await r.text();
        if (!r.ok) { console.error("sheet write failed:", r.status, text.slice(0, 120)); return false; }
        return true;
    } catch (e) {
        console.error("sheet unreachable:", e && e.message);
        return false;
    } finally {
        clearTimeout(timer);
    }
}

/* Written when the invoice is created, before the payer reaches the bank. The
 * row exists as "pending" from that moment, so an order is never lost because
 * the callback did not arrive — a pending row with a name and an email can be
 * chased; a payment with neither cannot. */
function recordOrder(o) {
    return post({
        action: "order",
        reference: o.reference,
        name: o.name,
        certName: o.certName || "",
        email: o.email,
        phone: o.phone || "",
        cell: o.cell || "",
        pits: o.pits,
        seedlings: o.pits * 3,
        amount: o.amount,
        currency: o.currency,
        status: "pending",
    });
}

/* Written when the provider tells us what happened. */
function updateStatus(reference, status, txnId, method, opts) {
    return post({
        action: "status",
        reference: reference,
        status: status,
        txnId: txnId || "",
        method: method || "",
        /* The Apps Script emails the certificate itself the moment a row turns
           paid. That is right for a payment happening now and wrong for one
           being recovered months later, which may already have been answered by
           hand. The sweep says so, and the script honours it. */
        suppressCertificate: Boolean(opts && opts.quiet),
    });
}

module.exports = { configured, recordOrder, updateStatus };
