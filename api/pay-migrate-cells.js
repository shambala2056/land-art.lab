/* Moves the stored history onto the new cell codes. Run once, before or with
 * the deploy that renames the cells.
 *
 * WHY THIS IS NOT OPTIONAL
 *
 * Cells used to be A-01 … F-18, a size class and an index. They are now one
 * letter each, A … BB. Everything already in the ledger still says the old
 * thing: seventy-odd orders carry cell "F-12", and the count of pits sold in
 * that cell lives under the key sold:F-12.
 *
 * Deploy the rename without moving them and the site reads sold:Z, finds
 * nothing, and offers ground that is already paid for. A real sale disappears
 * quietly, which is the worst way for one to disappear.
 *
 * What it moves:
 *   order:{ref}.cell     F-12  ->  Z
 *   sold:{old}           the pits confirmed in that cell, onto the new key
 *   ref:{ref}            live reservations, so one held during the migration
 *                        still confirms into the right cell
 *
 * Reservations that have expired are left alone: they are read by score and
 * nothing will ever look at them again.
 *
 * Idempotent. A second run finds every order already lettered and every old key
 * already gone, and reports that it did nothing.
 *
 * Run from the buttons on orders.html; the token goes in an x-orders-token
 * header, never in the URL.
 *   ?dry=1   report only
 */

const ledger = require("./_ledger");
const crypto = require("crypto");

/* The one true mapping, generated from the same SHAPE order the site uses. */
const NEW = {
    "A-01": "AH",
    "A-02": "AM",
    "A-03": "AS",
    "B-01": "K",
    "B-02": "AB",
    "B-03": "AL",
    "B-04": "BA",
    "C-01": "P",
    "C-02": "R",
    "C-03": "AC",
    "C-04": "AE",
    "C-05": "AY",
    "C-06": "AZ",
    "D-01": "E",
    "D-02": "J",
    "D-03": "S",
    "D-04": "AD",
    "D-05": "AN",
    "D-06": "AK",
    "D-07": "AR",
    "D-08": "AV",
    "E-01": "B",
    "E-02": "H",
    "E-03": "L",
    "E-04": "Q",
    "E-05": "O",
    "E-06": "T",
    "E-07": "Y",
    "E-08": "AA",
    "E-09": "W",
    "E-10": "AF",
    "E-11": "AI",
    "E-12": "AO",
    "E-13": "AT",
    "E-14": "AU",
    "E-15": "AX",
    "F-01": "A",
    "F-02": "F",
    "F-03": "D",
    "F-04": "C",
    "F-05": "G",
    "F-06": "I",
    "F-07": "U",
    "F-08": "V",
    "F-09": "M",
    "F-10": "N",
    "F-11": "X",
    "F-12": "Z",
    "F-13": "AJ",
    "F-14": "AG",
    "F-15": "AP",
    "F-16": "AQ",
    "F-17": "AW",
    "F-18": "BB"
};

const OLD_CODE = /^[A-F]-\d{2}$/;

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
    if (!process.env.ORDERS_TOKEN) return res.status(503).json({ error: "Not configured." });
    if (!tokenOk(token)) return res.status(401).json({ error: "Unauthorized." });
    if (!ledger.configured()) return res.status(503).json({ error: "No ledger is connected." });

    const dry = Boolean(req.query && req.query.dry);
    const cmd = ledger._cmd;

    const rows = await ledger.listOrders(2000);
    if (!rows) return res.status(502).json({ error: "Couldn't read the order book." });

    /* 1. the orders themselves */
    const moved = [], unknown = [];
    for (const o of rows) {
        const cell = o.cell || "";
        if (!OLD_CODE.test(cell)) continue;              /* already a letter, or none */
        const to = NEW[cell];
        if (!to) { unknown.push({ reference: o.reference, cell: cell }); continue; }
        moved.push({ reference: o.reference, from: cell, to: to,
                     pits: o.pits || 0, status: o.status || "pending" });
        if (!dry) {
            const raw = await cmd(["GET", "order:" + o.reference]);
            if (raw) {
                let rec; try { rec = JSON.parse(raw); } catch (e) { rec = null; }
                if (rec) {
                    rec.cell = to;
                    if (rec.treePrefix && OLD_CODE.test(rec.treePrefix)) rec.treePrefix = to;
                    await cmd(["SET", "order:" + o.reference, JSON.stringify(rec)]);
                }
            }
            const held = await cmd(["GET", "ref:" + o.reference]);
            if (held) {
                const i = String(held).lastIndexOf(":");
                await cmd(["SET", "ref:" + o.reference,
                           to + ":" + String(held).slice(i + 1), "EX", "3600"]);
            }
        }
    }

    /* 2. the sold counters — the numbers the map reads */
    const counters = [];
    for (const oldCell of Object.keys(NEW)) {
        const n = Number(await cmd(["GET", "sold:" + oldCell])) || 0;
        if (!n) continue;
        const to = NEW[oldCell];
        const already = Number(await cmd(["GET", "sold:" + to])) || 0;
        counters.push({ from: oldCell, to: to, pits: n, alreadyOnTarget: already });
        if (!dry) {
            /* Added rather than replaced: if anything has already been sold
               under the new letter, both are real and both must survive. */
            await cmd(["INCRBY", "sold:" + to, String(n)]);
            await cmd(["DEL", "sold:" + oldCell]);
        }
    }

    const summary = {
        orders: rows.length,
        ordersToMove: moved.length,
        countersToMove: counters.length,
        pitsMoved: counters.reduce((s, c) => s + c.pits, 0),
        unmappable: unknown.length,
        dryRun: dry,
        note: moved.length || counters.length
            ? (dry ? "Nothing has been changed. Run again without dry=1 to move it."
                   : "Moved. Safe to run again; it will find nothing left to do.")
            : "Nothing to move — the history is already on the new codes.",
    };
    console.log("cell migration:", JSON.stringify(summary));
    return res.status(200).json({ summary, orders: moved, counters, unmappable: unknown });
};
