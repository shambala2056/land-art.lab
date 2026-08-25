/* Asks the provider about every order still sitting as pending, and records the
 * ones that actually got paid.
 *
 * WHY THIS EXISTS
 *
 * A payment is recorded down two paths — the provider's webhook, and the
 * buyer's browser coming back. Both can fail, and when both fail nothing tries
 * again: the money moved, the provider knows, and our order sits as "pending"
 * for ever. That is not hypothetical. A webhook is refused if the URL secret on
 * the invoice no longer matches the one in the environment, which is what
 * happens to every invoice already issued the moment MINU_WEBHOOK_KEY is
 * rotated. The browser path deliberately will not sell against a claim it
 * cannot verify. So a run of orders can be genuinely paid and permanently
 * pending, with the sheet faithfully reporting pending because that is what it
 * was told.
 *
 * This closes that hole. It walks the pending orders, asks the provider what it
 * says about each reference, and settles the ones it confirms — through the
 * same settle() every other path uses, so the ledger, the sheet, the tree
 * numbers and the notification all happen exactly as they would have.
 *
 * It is also the diagnostic. The report says, per reference, what the provider
 * actually answered:
 *
 *   paid       the provider confirms it — now recorded, and it was our fault
 *              it was not, so check the webhook
 *   pending    the provider agrees nobody has paid — nothing is wrong
 *   cancelled  the payer walked away — the pits are released
 *   unknown    the provider cannot be reached, or has never heard of this
 *              reference. The second is the serious one: if money reached the
 *              bank under a different reference from ours, no amount of asking
 *              about our reference will find it, and it has to be matched by
 *              hand from the bank statement.
 *
 * Safe to run repeatedly: settle() is idempotent, an order already paid is
 * skipped, and ?dry=1 asks without recording anything.
 *
 * Run from the buttons on orders.html — the token goes in an x-orders-token
 * header, never in the URL, because a URL is logged and a header is not.
 *   ?dry=1     report only, change nothing
 *   ?notify=1  also email the buyer (off by default)
 */

const ledger = require("./_ledger");
const { settle, verify, wordFor } = require("./_settle");
const crypto = require("crypto");

function tokenOk(given) {
    const want = process.env.ORDERS_TOKEN;
    if (!want || !given) return false;
    const a = Buffer.from(String(given)), b = Buffer.from(String(want));
    if (a.length !== b.length) { crypto.timingSafeEqual(a, a); return false; }
    return crypto.timingSafeEqual(a, b);
}

/* One at a time. Each reference costs a login and a lookup at the provider, and
 * firing hundreds at once is how a merchant account gets rate-limited — the
 * cure would then be worse than the fault. */
const MAX_PER_RUN = 60;

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    /* Header only, never the query string. These two change what the site
       believes about money, and a token in a URL is a token in the Vercel
       access log, in browser history and in any referrer the page leaks. Run
       them from the order book page, which holds the token in memory and sends
       it as a header. */
    const token = req.headers["x-orders-token"] || "";
    if (req.query && req.query.token) {
        console.warn("refused: the token was passed in the URL, which logs it");
        return res.status(400).json({
            error: "Pass the token as an x-orders-token header, not in the URL — " +
                   "a token in a URL ends up in logs and browser history. " +
                   "Use the buttons on orders.html.",
        });
    }
    if (!process.env.ORDERS_TOKEN) {
        return res.status(503).json({ error: "Not configured — set ORDERS_TOKEN." });
    }
    if (!tokenOk(token)) {
        console.warn("reconcile refused: bad or missing token");
        return res.status(401).json({ error: "Unauthorized." });
    }
    if (!ledger.configured()) {
        return res.status(503).json({ error: "No ledger is connected, so there is nothing to reconcile." });
    }

    const dry = Boolean(req.query && req.query.dry);
    /* Default to silence. A sweep of old orders can include payments a person
       already answered by hand, and a second certificate email is worse than
       none — the buyer has to work out which one is real. Pass notify=1
       deliberately when the sweep is of orders nobody has touched. */
    const quiet = !(req.query && String(req.query.notify) === "1");
    const rows = await ledger.listOrders(2000);
    if (!rows) return res.status(502).json({ error: "Couldn't read the order book." });

    const pending = rows.filter((r) => !r.status || r.status === "pending");
    const looked = pending.slice(0, MAX_PER_RUN);

    const report = [];
    for (const order of looked) {
        let says, changed = false, error = null;
        try {
            const code = await verify(order.reference);
            says = code === undefined ? "unknown" : wordFor(code);
            /* Only a verdict is acted on. "unknown" means the provider could not
               be asked or does not know the reference, and neither is grounds to
               move money's worth of state. */
            if (!dry && says !== "unknown" && says !== "pending") {
                await settle(order.reference, says, order.txnId, order.method, "reconcile", false,
                             { quiet: quiet });
                changed = true;
            }
        } catch (err) {
            says = "unknown";
            error = String(err && err.message || err).slice(0, 140);
            console.error("reconcile failed for", order.reference, error);
        }
        report.push({
            reference: order.reference, cell: order.cell || null, pits: order.pits || null,
            name: order.name || null, email: order.email || null,
            created: order.created || null,
            provider: says, recorded: changed, error: error,
        });
    }

    const count = (w) => report.filter((r) => r.provider === w).length;
    const summary = {
        orders: rows.length,
        pending: pending.length,
        checked: report.length,
        notChecked: Math.max(0, pending.length - report.length),
        paid: count("paid"),
        stillPending: count("pending"),
        cancelledOrExpired: count("cancelled") + count("expired") + count("failed"),
        unknown: count("unknown"),
        recorded: report.filter((r) => r.recorded).length,
        dryRun: dry,
        notificationsSent: !quiet,
    };
    console.log("reconcile:", JSON.stringify(summary));

    return res.status(200).json({
        summary: summary,
        /* What to make of it, so the answer does not need this file open. */
        reading: {
            paid: "The provider confirms these. They are now recorded — but they should have " +
                  "been recorded when they happened, so check MINU_WEBHOOK_KEY against the key " +
                  "on the invoices and the webhook address the provider is calling.",
            unknown: "The provider could not be asked, or does not know this reference. If the " +
                     "money is on the bank statement under a different reference, it has to be " +
                     "matched by hand — asking about ours will never find it.",
            stillPending: "The provider agrees nobody paid. Nothing is wrong with these.",
        },
        orders: report,
    });
};
