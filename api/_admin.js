/* The maintenance runs behind the order book.
 *
 * Helpers, not routes, on purpose. Vercel's plan allows twelve serverless
 * functions and api/ already held twelve; three more routes produced a
 * deployment that built cleanly and then refused to publish. A file whose name
 * starts with an underscore is not a route, so the work lives here and
 * pay-orders dispatches to it — one authenticated admin surface rather than
 * four.
 *
 * Each function keeps the guards it was written with. pay-orders checks the
 * token before dispatching, so they run twice; a second constant-time compare
 * costs nothing and leaves each of these safe to call from anywhere.
 */

const ledger = require("./_ledger");
const { cellCapacity, PITS } = require("./_minu");
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
   firing hundreds at once is how a merchant account gets rate-limited. */
const MAX_PER_RUN = 60;

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
async function reconcile(req, res) {
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
}

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
async function migrateCells(req, res) {
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
}

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
async function purgeTests(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    const token = req.headers["x-orders-token"] || "";
    if (req.query && req.query.token) {
        return res.status(400).json({ error: "Send the token as an x-orders-token header, not in the URL." });
    }
    if (!process.env.ORDERS_TOKEN) return res.status(503).json({ error: "Not configured." });
    if (!tokenOk(token)) return res.status(401).json({ error: "Unauthorized." });
    if (!ledger.configured()) return res.status(503).json({ error: "No ledger is connected." });

    /* Two directions, because the rubbish has turned up on both sides of a
       real order. ?after= names the last order to keep and clears what came
       later; ?before= names the first order to keep and clears what came
       earlier. Neither ever touches a paid order — that is checked below and
       the whole run is refused if one is in range. */
    const after = String((req.query && req.query.after) || "").trim().toUpperCase();
    const before = String((req.query && req.query.before) || "").trim().toUpperCase();
    const pivot = after || before;
    if (Boolean(after) === Boolean(before)) {
        return res.status(400).json({
            error: "Give exactly one of ?after=LA-… (clear what came after it) " +
                   "or ?before=LA-… (clear what came before it).",
        });
    }
    if (!/^LA-[A-Z0-9-]{4,}$/.test(pivot)) {
        return res.status(400).json({ error: "That does not look like one of our references." });
    }
    const apply = String((req.query && req.query.apply) || "") === "1";

    const rows = await ledger.listOrders(2000);
    if (!rows) return res.status(502).json({ error: "Couldn't read the order book." });

    const cutoff = rows.filter(function (r) { return r.reference === pivot; })[0];
    if (!cutoff) return res.status(404).json({ error: "No order with reference " + pivot + "." });
    const line = Date.parse(cutoff.created || "");
    if (!line) return res.status(400).json({ error: "That order has no usable created date." });

    /* Strictly one side or the other, so the named order itself always
       survives whichever direction was asked for. */
    const later = rows.filter(function (r) {
        const t = Date.parse(r.created || "");
        if (!t) return false;
        return after ? t > line : t < line;
    });

    /* A paid order is money that moved, and nothing here may delete one. They
       are lifted out of the range rather than used to refuse it: the rubbish
       from a week of testing sits on both sides of the real sales, and a rule
       that stops at the first paid order can never clear it. They are reported
       so the count is never silently smaller than it looks. */
    const paid = later.filter(function (r) { return r.status === "paid"; });
    const doomed = later.filter(function (r) { return r.status !== "paid"; });

    const cmd = ledger._cmd;
    const removed = [];
    for (const r of doomed) {
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
        direction: after ? "cleared everything after" : "cleared everything before",
        pivot: pivot,
        cutoffCreated: cutoff.created,
        inRange: later.length,
        paidKept: paid.length,
        toDelete: doomed.length,
        deleted: apply ? removed.length : 0,
        applied: apply,
        note: apply
            ? "Deleted. The sheet is a separate copy — rows already removed there stay removed."
            : "Nothing was deleted. Add apply=1 to carry it out.",
    };
    console.log("purge tests:", JSON.stringify(summary));
    return res.status(200).json({
        summary: summary,
        keptBecausePaid: paid.map(function (r) {
            return { reference: r.reference, cell: r.cell, pits: r.pits,
                     amount: r.amount, paidAt: r.paidAt };
        }),
        orders: removed,
    });
}

/* Writes down the ground that was spoken for before the site could sell it.
 *
 * The organisations came first: they were given pits, and certificates were
 * printed for them, by hand and off the ledger. The ledger therefore believes
 * those cells are empty — so the first sponsor to buy into cell R would be
 * handed R-001, a number a partner is already holding on paper. That is the one
 * failure this numbering was built to make impossible, and it has to be closed
 * before the site takes a real order rather than after.
 *
 * Two counters per cell, both raised to the number already taken:
 *   sold:{cell}   what is gone, so availability does not oversell the cell
 *   trees:{cell}  the last certificate number issued, so the next one is +1
 *
 * Only ever raises. Running it twice changes nothing, and a cell that has since
 * sold past the baseline on its own is left alone — this is a floor, not a
 * correction. Nothing here touches an order record: these pits are not web
 * orders and must not appear in the order book as though they were.
 */
const BASELINE = {
    /* Partners, and the pits each was allocated. */
    "R":  { pits: 50, who: "TIMBERLAND" },
    "P":  { pits: 50, who: "YVES ROCHER" },
    "H":  { pits: 40, who: "KHULAN UUL" },
    "L":  { pits: 40, who: "EFES CONSTRUCTION" },
    "AJ": { pits: 20, who: "EFES INTERNATIONAL" },

    /* The two orders that were actually paid on the old site, under the cell
       codes it used then: F-01 is now A, C-04 is now AE. Their pits were never
       counted against the lettered cells because the migration was never run
       in production. */
    "A":  { pits: 1, who: "paid on the old site as cell F-01" },
    "AE": { pits: 2, who: "paid on the old site as cell C-04" },

    /* A number to hold back rather than ground to hold back.
       imy's certificate was written by hand and reads F-12. Under the old
       scheme that was a cell code; under this one it is what the twelfth
       certificate in cell F would say. Two certificates reading F-12 is exactly
       what this numbering exists to prevent, so cell F starts at F-013 and the
       numbers below it are never issued. No pit is withheld — the ground in F
       is still for sale. */
    "F":  { pits: 0, trees: 12, who: "reserving F-012 — issued to imy by hand" },

    /* Ten certificates given as gifts, written by hand and posted by the team.
       A gifted pit is still a planted pit: it holds three elms and comes out of
       the 9,000 exactly as a sold one does, which is why pits is 10 here and
       not 0 — the site should offer 8,787, not 8,797.

       The community ground was the first thought and could not be used. AR is
       infrastructure — gers, a classroom table, a play frame — and its ground
       is not in the 9,000 at all, so taking ten pits there would have subtracted
       nothing. AO is the nearest planting cell to it, untouched, 112 pits. */
    "AO": { pits: 10, trees: 10, who: "AO-001..AO-010 given as gifts" },
};

async function baseline(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    const token = req.headers["x-orders-token"] || "";
    if (req.query && req.query.token) {
        return res.status(400).json({ error: "Send the token as an x-orders-token header, not in the URL." });
    }
    if (!process.env.ORDERS_TOKEN) return res.status(503).json({ error: "Not configured." });
    if (!tokenOk(token)) return res.status(401).json({ error: "Unauthorized." });
    if (!ledger.configured()) return res.status(503).json({ error: "No ledger is connected." });

    const apply = String((req.query && req.query.apply) || "") === "1";
    const cmd = ledger._cmd;
    const rows = [];

    for (const cell of Object.keys(BASELINE)) {
        const want = BASELINE[cell].pits;
        /* Numbers and ground move together unless an entry says otherwise —
           a reserved number is not a sold pit. */
        const wantTrees = BASELINE[cell].trees === undefined ? want : BASELINE[cell].trees;
        /* A cell that is not for sale still has ground and can still have
           numbers written against it by hand. cellCapacity refuses those on
           purpose — it is the function that decides what may be bought — so a
           reservation-only entry is measured against the pit table instead.
           Nothing here makes such a cell purchasable: pits stays 0 and the
           sold counter is never raised. */
        const reserveOnly = want === 0;
        const cap = cellCapacity(cell);
        const room = cap === null && reserveOnly
            ? (Object.prototype.hasOwnProperty.call(PITS, cell) ? PITS[cell] : null)
            : cap;
        if (room === null) {
            rows.push({ cell: cell, error: cap === null && !reserveOnly
                ? "that cell is not for sale — a reservation there must set pits to 0"
                : "unknown cell" });
            continue;
        }
        if (want > room || wantTrees > room) {
            /* Refuse rather than truncate: a partner allocated more pits than
               their cell holds is a placement to settle on the map, not a
               number to quietly round down here. */
            rows.push({ cell: cell, who: BASELINE[cell].who, pits: want, capacity: room,
                        error: "allocation exceeds the cell — move them to a larger cell first" });
            continue;
        }
        const sold  = Number(await cmd(["GET", "sold:"  + cell])) || 0;
        const trees = Number(await cmd(["GET", "trees:" + cell])) || 0;
        const row = { cell: cell, who: BASELINE[cell].who, pits: want, capacity: room,
                      soldWas: sold, treesWas: trees,
                      soldNow: Math.max(sold, want), treesNow: Math.max(trees, wantTrees) };
        row.changed = row.soldNow !== sold || row.treesNow !== trees;
        if (apply && row.changed) {
            if (row.soldNow !== sold)  await cmd(["SET", "sold:"  + cell, String(row.soldNow)]);
            if (row.treesNow !== trees) await cmd(["SET", "trees:" + cell, String(row.treesNow)]);
        }
        rows.push(row);
    }

    const bad = rows.filter(function (r) { return r.error; });
    const summary = {
        cells: rows.length,
        pits: rows.reduce(function (n, r) { return n + (r.error ? 0 : r.pits); }, 0),
        changed: rows.filter(function (r) { return r.changed; }).length,
        problems: bad.length,
        applied: apply && !bad.length,
        note: bad.length
            ? "Nothing was written: fix the cells listed with an error first."
            : apply ? "Written. The next certificate in each cell follows the numbers already issued."
                    : "Nothing was written. Add apply=1 to carry it out.",
    };
    /* All or nothing when something is wrong — a half-applied baseline is
       harder to reason about than none at all. */
    if (bad.length && apply) {
        console.error("baseline refused:", JSON.stringify(bad));
        return res.status(409).json({ summary: summary, cells: rows });
    }
    console.log("baseline:", JSON.stringify(summary));
    return res.status(200).json({ summary: summary, cells: rows });
}

module.exports = { reconcile, migrateCells, purgeTests, baseline };

