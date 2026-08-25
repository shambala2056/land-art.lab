/* Records the outcome of a payment: ledger, order book, sheet, notification.
 *
 * There are two entirely separate ways the provider tells us a payment
 * happened, and both must record it:
 *
 *   1. The callback (pay-callback) — a server-to-server POST to the "webhook"
 *      address on the invoice. Independent of the buyer's browser, so it
 *      arrives even if they close the tab the moment the bank approves.
 *
 *   2. The return (pay-return) — the buyer's own browser, redirected by the
 *      provider to the "redirectUtl" address with the result in the query
 *      string. Arrives only if the buyer waits for the redirect.
 *
 * Neither is reliable alone: a callback can be misconfigured on the provider's
 * side, a browser can be closed. Both call this, and whichever gets here first
 * does the work — the second finds nothing left to do, because every step below
 * is idempotent. A pit is never sold twice and a row is never doubled.
 *
 * Nothing here trusts what it was told. The status is taken from the provider's
 * own record, looked up over our authenticated merchant session, because the
 * return path in particular is just a URL the buyer's browser was sent to — and
 * a URL can be typed by hand.
 */

const ledger = require("./_ledger");
const sheet = require("./_sheet");
const { config, login, checkTxn } = require("./_minu");

/* Provider codes: 000 paid · 010 expired · 011 cancelled · anything else failed.
   null/absent means the invoice exists but has not been paid. */
function wordFor(code) {
    if (String(code) === "000") return "paid";
    if (String(code) === "011") return "cancelled";
    if (String(code) === "010") return "expired";
    if (code === null || code === undefined || code === "") return "pending";
    return "failed";
}

/* Asks the provider what actually happened.
 *
 * Returns the provider's status code, or undefined if it could not be asked —
 * an outage, a missing configuration. Undefined is not "unpaid": the caller
 * decides what to do without an answer, and the two callers decide differently.
 */
async function verify(reference) {
    const { cfg, missing } = config();
    if (missing.length) return undefined;
    try {
        const token = await login(cfg);
        if (!token) return undefined;
        const r = await checkTxn(cfg, token, reference);
        return r.reached ? r.status : undefined;
    } catch (err) {
        console.error("could not verify payment with the provider:", reference, err && err.message);
        return undefined;
    }
}

/* Records an outcome. `claimed` is what the caller was told; `verified` is what
 * the provider says, and wins wherever the two disagree.
 *
 * Returns the word the buyer should be shown.
 */
async function settle(reference, claimed, txnId, method, source, trustClaim, opts) {
    if (!reference) return "unknown";
    /* Recovering a payment that was handled by hand must not tell the buyer
       about it again. Reconciliation sweeps up months-old orders, and some of
       them have already had a certificate posted by a person. */
    const quiet = Boolean(opts && opts.quiet);

    const verified = await verify(reference);
    const said = wordFor(verified);        /* "pending" when unpaid or unasked */
    const claim = wordFor(claimed);

    /* A sale and a release are held to different standards, because getting
       them wrong costs different things.

       SELLING needs the provider to say so. It says "000" or nothing is sold —
       with one exception: when the provider cannot be reached at all, the
       callback's word stands, because it came over an authenticated connection
       carrying a secret only the provider holds, and refusing it would lose a
       payment that really happened. The browser return gets no such credit: it
       is a URL someone's browser was pointed at, and anyone can type
       "status=success" into one.

       RELEASING acts on the claim. When a payer cancels, the provider still
       reports the invoice as open — its own record does not distinguish "not
       paid yet" from "walked away" — so waiting for a verdict would hold the
       pits for the full half-hour of the reservation. In a five-pit cell that
       means someone who cancels and immediately tries again is told the cell
       has sold out, by their own abandoned attempt. Freeing a reservation is
       the safe direction to be wrong in: nothing is lost that cannot be
       reserved again a second later. */
    let state;
    if (said === "paid") {
        state = "paid";
    } else if (verified === undefined) {
        state = (claim === "paid" && !trustClaim) ? "pending" : claim;
        if (claim === "paid" && !trustClaim) {
            console.warn("not selling against an unverified claim on the", source,
                         "path:", reference);
        } else {
            console.warn("settling", reference, "as", state,
                         "on the", source, "path — the provider gave no verdict");
        }
    } else if (said === "pending" && claim !== "paid" && claim !== "pending") {
        /* The provider still shows it open; the caller says it ended. */
        state = claim;
    } else {
        state = said;
    }

    /* The ledger first: it decides whether the ground is spoken for, and must be
       right even if everything after it fails. Confirming twice is safe — the
       reservation is gone after the first, and a sale without one does nothing. */
    try {
        if (state === "paid") await ledger.confirm(reference);
        else if (state === "cancelled" || state === "expired" || state === "failed") {
            await ledger.release(reference);
        }
        /* "pending" touches nothing: the reservation stands until it is paid or
           it expires on its own. */
    } catch (err) {
        console.error("ledger update failed for", reference, err && err.message);
    }

    if (state !== "pending") {
        try { await ledger.markOrder(reference, state, txnId, method); }
        catch (err) { console.error("ledger order update failed for", reference, err && err.message); }
        try { await sheet.updateStatus(reference, state, txnId, method, { quiet: quiet }); }
        catch (err) { console.error("sheet status update failed for", reference, err && err.message); }
    }

    /* One certificate per PIT — a pit is three saplings and one certificate,
       not three. The numbers are handed out here: after the money is real,
       before anyone is told to go and collect them. Safe to reach twice, since
       a payment settles down both the callback and the browser return, and an
       order that already holds a block of numbers keeps it. */
    if (state === "paid") {
        try {
            const order = await ledger.readOrder(reference);
            const pits = order && Number(order.pits);
            /* The cell code is the certificate's prefix, so numbering is per
               cell and two cells can never produce the same code. */
            if (pits > 0) await ledger.assignTrees(reference, pits, order.cell);
        } catch (err) {
            /* A certificate that has to be issued by hand is a nuisance; a
               payment rejected because numbering failed is a lost sale. */
            console.error("tree numbers not assigned for", reference, err && err.message);
        }
    }

    if (state === "paid" && !quiet) await notify(reference, txnId, method, source);
    if (state === "paid" && quiet) {
        console.log("settled quietly, no notification sent:", reference);
    }
    return state;
}

/* Tells a person a payment arrived. Best-effort by design: a notification that
 * fails must never fail a payment that succeeded.
 *
 * Sent once per reference. Both paths can reach a paid payment, and without
 * this the team would get the same payment twice — which, read quickly, looks
 * like two sponsorships. */
async function notify(reference, txnId, method, source) {
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO_EMAIL) return;
    if (!(await ledger.claimOnce("notified:" + reference))) return;
    try {
        const { Resend } = require("resend");
        await new Resend(process.env.RESEND_API_KEY).emails.send({
            from: process.env.CONTACT_FROM_EMAIL || "Land-Art Lab <onboarding@resend.dev>",
            to: process.env.CONTACT_TO_EMAIL,
            subject: "Payment received — " + reference,
            text: "Reference: " + reference +
                  "\nProvider transaction: " + (txnId || "—") +
                  "\nMethod: " + (method || "—") +
                  "\nHeard via: " + source,
        });
    } catch (err) {
        console.error("payment received but the notification email failed:", err && err.message);
    }
}

module.exports = { settle, verify, wordFor };
