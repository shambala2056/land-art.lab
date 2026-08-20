/* How many pits are left in each cell.
 *
 * The map asks for this so it can cap the quantity control and mark a cell as
 * sold out. It discloses nothing private: how much of a cell remains is exactly
 * what a visitor is being invited to buy.
 *
 * When no ledger is configured this returns tracked:false and no counts, and
 * the map then shows each cell's full capacity without claiming any of it is
 * still available. Showing a remaining figure we cannot stand behind would be
 * worse than showing none.
 */

const { CATALOG, cellCapacity } = require("./_minu");
const ledger = require("./_ledger");

const ALLOWED = ["https://land-art.space", "https://www.land-art.space"];

/* Only cells that are actually on sale. Infrastructure cells and cells already
 * held by a partner are not sold through the map, so they are not listed. */
function sellableCells(codes) {
    return codes.filter((c) => cellCapacity(c) !== null);
}

module.exports = async function handler(req, res) {
    const origin = ALLOWED.indexOf(req.headers.origin) > -1 ? req.headers.origin : ALLOWED[0];
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    /* Short cache. Availability changes when someone buys, and a stale figure
       here means a payer is refused at the last step instead of being told
       up front — annoying, but never an oversale, because pay-create checks
       the ledger again before taking money. */
    res.setHeader("Cache-Control", "public, max-age=20");

    if (req.method === "OPTIONS") return res.status(204).end();

    if (!ledger.configured()) {
        return res.status(200).json({ tracked: false, cells: {} });
    }

    /* The map sends the codes it is showing, so this does not have to know the
       site layout — one less place for the two to drift apart. */
    let codes = [];
    if (req.method === "POST" && req.body && Array.isArray(req.body.cells)) {
        codes = sellableCells(req.body.cells.filter((c) => typeof c === "string").slice(0, 120));
    }
    if (!codes.length) return res.status(200).json({ tracked: true, cells: {} });

    const out = {};
    await Promise.all(codes.map(async (code) => {
        const cap = cellCapacity(code);
        const t = await ledger.takenIn(code);
        if (!t) { out[code] = { capacity: cap, remaining: cap, unknown: true }; return; }
        out[code] = {
            capacity: cap,
            remaining: Math.max(0, cap - t.sold - t.held),
            sold: t.sold,
        };
    }));

    return res.status(200).json({ tracked: true, cells: out });
};
