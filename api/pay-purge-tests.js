/* Removes test orders from the ledger.
 *
 * Live testing leaves real rows behind. They are harmless — an abandoned
 * reservation expires on its own and holds no ground — but they sit in the
 * order book as pending for ever, and reconciliation would sweep them up and
 * write them back into the sheet after someone had already deleted them there
 * by hand.
 *
 * Deleting from the Google Sheet does not delete from here. The sheet is a
 * copy; this is the record. So this is what actually removes them.
 *
 * You name a cut-off order. Everything created strictly AFTER it goes. That
 * matches how the boundary is actually known — "my last real order was this
 * one" — rather than making anyone list two dozen references.
 *
 * WHAT IT WILL NOT DO
 *   - touch anything at or before the cut-off
 *   - touch a paid order, whatever the cut-off says. A paid order is money
 *     that moved; if one is on the wrong side of the line then the line is
 *     wrong, and it stops rather than deleting it
 *   - do anything without apply=1. The default is a report
 *
 * Deletion is not reversible. Read the dry run first.
 *
 *   ?after=LA-…            report what would go
 *   ?after=LA-…&apply=1    delete it
 */

const ledger = require("./_ledger");
const crypto = require("crypto");

function tokenOk(given) {
    const want = process.env.ORDERS_TOKEN;
    if (!want || !given) return false;
    const a = Buffer.from(String(given)), b = Buffer.from(String(want));
    if (a.length !== b.length) { crypto.timingSafeEqual(a, a); return false; }
    return crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    const token = req.headers["x-orders-token"] || "";
    if (req.query && req.query.token) {
        return res.status(400).json({ error: "Send the token as an x-orders-token header, not in the URL." });
    }
    if (!process.env.ORDERS_TOKEN) return res.status(503).json({ error: "Not configured." });
    if (!tokenOk(token)) return res.status(401).json({ error: "Unauthorized." });
    if (!ledger.configured()) return res.status(503).json({ error: "No ledger is connected." });

    const after = String((req.query && req.query.after) || "").trim().toUpperCase();
    if (!/^LA-[A-Z0-9-]{4,}$/.test(after)) {
        return res.status(400).json({
            error: "Name the last order to KEEP, as ?after=LA-… — everything created after it goes.",
        });
    }
    const apply = String((req.query && req.query.apply) || "") === "1";

    const rows = await ledger.listOrders(2000);
    if (!rows) return res.status(502).json({ error: "Couldn't read the order book." });

    const cutoff = rows.filter(function (r) { return r.reference === after; })[0];
    if (!cutoff) return res.status(404).json({ error: "No order with reference " + after + "." });
    const line = Date.parse(cutoff.created || "");
    if (!line) return res.status(400).json({ error: "That order has no usable created date." });

    /* Strictly after, so the named order itself always survives. */
    const later = rows.filter(function (r) {
        const t = Date.parse(r.created || "");
        return t && t > line;
    });

    const paid = later.filter(function (r) { return r.status === "paid"; });
    if (paid.length) {
        return res.status(409).json({
            error: "Refusing: " + paid.length + " paid order(s) are newer than the cut-off. " +
                   "A paid order is money that moved. Check the cut-off before going further.",
            paid: paid.map(function (r) {
                return { reference: r.reference, cell: r.cell, name: r.name,
                         amount: r.amount, paidAt: r.paidAt };
            }),
        });
    }

    const cmd = ledger._cmd;
    const removed = [];
    for (const r of later) {
        removed.push({ reference: r.reference, created: r.created, cell: r.cell || null,
                       name: r.name || null, email: r.email || null,
                       status: r.status || "pending" });
        if (apply) {
            /* Give any live reservation back before the order that owns it is
               gone, or those pits stay held until they expire on their own. */
            try { await ledger.release(r.reference); } catch (e) { /* nothing held */ }
            await cmd(["DEL", "order:" + r.reference]);
            await cmd(["LREM", "orders", "0", r.reference]);
            await cmd(["DEL", "ref:" + r.reference]);
        }
    }

    const summary = {
        keptUpToAndIncluding: after,
        cutoffCreated: cutoff.created,
        ordersAfter: later.length,
        deleted: apply ? removed.length : 0,
        applied: apply,
        note: apply
            ? "Deleted. The sheet is a separate copy — rows already removed there stay removed."
            : "Nothing was deleted. Add apply=1 to carry it out.",
    };
    console.log("purge tests:", JSON.stringify(summary));
    return res.status(200).json({ summary: summary, orders: removed });
};
