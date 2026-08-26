/* The order book, readable by you and nobody else.
 *
 * Exists because the Google Sheet needs an Apps Script deployment that is not
 * done yet, and orders had nowhere to be read from in the meantime. Orders are
 * written to the ledger as well as the sheet, so this reads them straight back
 * out — as JSON, or as CSV that can be pasted into a spreadsheet.
 *
 * Set ORDERS_TOKEN in Vercel and send it as an x-orders-token header. Without
 * it this endpoint refuses: an unprotected order list would publish every
 * buyer's name and email address to anyone who guessed the URL.
 *
 * A ?token= query parameter is still read, because deleting it would lock out
 * anything already calling that way, but nothing here should use it: a URL is
 * written to browser history, to the server's access log, and to every proxy on
 * the path, with the token still in it. The maintenance actions refuse a query
 * token outright.
 */

const ledger = require("./_ledger");
const crypto = require("crypto");

function tokenOk(given) {
    const want = process.env.ORDERS_TOKEN;
    if (!want || !given) return false;
    const a = Buffer.from(String(given)), b = Buffer.from(String(want));
    /* Length must match before timingSafeEqual, and comparing anyway keeps the
       rejection from being timed. */
    if (a.length !== b.length) { crypto.timingSafeEqual(a, a); return false; }
    return crypto.timingSafeEqual(a, b);
}

const COLUMNS = ["created", "reference", "name", "certName", "email", "phone",
                 "cell", "pits", "seedlings", "treePrefix", "treeFirst", "treeLast",
                 "amount", "currency", "status", "paidAt", "txnId", "method"];

/* Quote every field: a name with a comma in it would otherwise split into two
 * columns, and a quote inside a value has to be doubled. */
function csv(rows) {
    const esc = (v) => '"' + String(v === undefined || v === null ? "" : v).replace(/"/g, '""') + '"';
    return [COLUMNS.map(esc).join(",")]
        .concat(rows.map((r) => COLUMNS.map((c) => esc(r[c])).join(",")))
        .join("\n");
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    /* Never let a browser on another site read this, and never let it be
       indexed or cached by anything in between. */
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    const token = (req.query && req.query.token) ||
                  (req.headers["x-orders-token"]) || "";

    if (!process.env.ORDERS_TOKEN) {
        console.error("order list is unavailable — set ORDERS_TOKEN in Vercel");
        return res.status(503).json({ error: "Not configured." });
    }
    if (!tokenOk(token)) {
        console.warn("order list refused: bad or missing token");
        return res.status(401).json({ error: "Unauthorized." });
    }

    if (!ledger.configured()) {
        return res.status(503).json({ error: "No ledger is connected, so no orders are stored." });
    }

    /* The maintenance runs live behind this same authenticated route rather
       than as routes of their own: the plan allows twelve serverless functions
       and api/ already holds twelve. They are guarded exactly as this listing
       is, and each re-checks the token for itself. */
    const action = (req.query && req.query.action) || "";
    if (action) {
        const admin = require("./_admin");
        if (action === "reconcile") return admin.reconcile(req, res);
        if (action === "migrate")   return admin.migrateCells(req, res);
        if (action === "purge")     return admin.purgeTests(req, res);
        if (action === "baseline")  return admin.baseline(req, res);
        if (action === "recount")   return admin.recount(req, res);
        return res.status(400).json({ error: "Unknown action." });
    }

    const limit = Math.max(1, Math.min(2000, parseInt((req.query && req.query.limit) || "500", 10) || 500));
    const rows = await ledger.listOrders(limit);
    if (!rows) return res.status(502).json({ error: "Couldn't read the order book." });

    if (req.query && req.query.format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="land-art-orders.csv"');
        return res.status(200).send(csv(rows));
    }

    const paid = rows.filter((r) => r.status === "paid");
    return res.status(200).json({
        count: rows.length,
        paid: paid.length,
        pits: paid.reduce((n, r) => n + (Number(r.pits) || 0), 0),
        seedlings: paid.reduce((n, r) => n + (Number(r.seedlings) || 0), 0),
        orders: rows,
    });
};
