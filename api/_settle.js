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
async function settle(reference, claimed, txnId, method, source, trustClaim) {
    if (!reference) return "unknown";

    const verified = await verify(reference);
    let state = verified === undefined ? wordFor(claimed) : wordFor(verified);

    /* Without a verdict from the provider, whether the claim may stand depends
       on who is making it.

       The callback came over an authenticated connection carrying a secret only
       the provider holds, so it is believed — refusing it would lose a payment
       that really happened whenever the lookup is down.

       The browser return is a URL someone's browser was pointed at. Anyone can
       type "status=success" into it. Unverified, a claimed payment there is
       held at pending: the reservation stands, the callback or the page's own
       polling settles it, and nothing is sold on the strength of an address
       bar. A claimed failure is still acted on — releasing pits early is safe
       whoever asks, and at worst frees a reservation the payer can remake. */
    if (verified === undefined && state === "paid" && !trustClaim) {
        console.warn("not selling against an unverified claim on the", source,
                     "path:", reference);
        state = "pending";
    } else if (verified === undefined) {
        console.warn("settling", reference, "as", state,
                     "on the", source, "path — the provider gave no verdict");
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
        try { await sheet.updateStatus(reference, state, txnId, method); }
        catch (err) { console.error("sheet status update failed for", reference, err && err.message); }
    }

    if (state === "paid") await notify(reference, txnId, method, source);
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
