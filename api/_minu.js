/* Shared server-side client for the 360 Finance / MongolID ecommerce API.
 *
 * SECURITY — the whole point of this file:
 *   The merchant username, password and merchant code exist ONLY as environment
 *   variables read inside serverless functions. They are never written into any
 *   file that is served to a browser, never returned in a response body, and
 *   never logged. The browser's side of a payment is limited to "here is a SKU"
 *   in and "here is a hosted invoice URL" out; it never holds a credential, a
 *   bearer token, or the merchant code.
 *
 * Reference: ECOMMERCE_CLIENT_v6 — /login, /invoice, /checkTxn.
 */

const TIMEOUT_MS = 15000;

/* Read config at call time, not at module scope. A throw during module load
 * takes the whole function down with an opaque 500 on every request, including
 * the preflight — the same trap that hid the contact form's misconfiguration. */
function config() {
    const cfg = {
        base: (process.env.MINU_BASE_URL || "https://api.minu.mn/oncom-test").replace(/\/+$/, ""),
        username: process.env.MINU_USERNAME,
        password: process.env.MINU_PASSWORD,
        merchantCode: process.env.MINU_MERCHANT_CODE,
    };
    const missing = ["username", "password", "merchantCode"].filter((k) => !cfg[k]);
    return { cfg, missing };
}

/* Names only. Never the values — a config dump that prints secrets is how
 * credentials end up in a log aggregator. */
function describeMissing(missing) {
    return missing.map((k) => "MINU_" + k.replace(/[A-Z]/g, (c) => "_" + c).toUpperCase());
}

async function call(url, options) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const r = await fetch(url, Object.assign({ signal: ctrl.signal }, options));
        const text = await r.text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = { raw: text }; }
        return { ok: r.ok, httpStatus: r.status, body };
    } finally {
        clearTimeout(timer);
    }
}

/* A token lives 30 minutes, but a serverless invocation does not, and a token
 * cached in module scope would leak across warm invocations for different
 * requests. Logging in per request is a round trip we can afford and is the
 * option with no shared mutable secret. */
async function login(cfg) {
    const res = await call(cfg.base + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cfg.username, password: cfg.password }),
    });
    if (!res.ok || !res.body || res.body.status !== "000" || !res.body.entity) {
        /* Log the vendor's status code and message, never the request body. */
        console.error("minu login rejected:", {
            httpStatus: res.httpStatus,
            status: res.body && res.body.status,
            message: res.body && res.body.message,
        });
        return null;
    }
    return res.body.entity;
}

/* Prices live here, on the server. The browser sends a SKU and a quantity and
 * nothing else: if the amount came from the client, anyone could open the
 * console and buy a hectare for one tögrög.
 *
 * THE UNIT IS A PLANTING PIT, NOT A SQUARE METRE.
 *   1 pit = 3 seedlings = USD 30 = MNT 100,000
 *   pits are dug 1.5 m apart in both directions, so one occupies 2.25 m²
 *
 * The site previously priced a square metre at USD 30 while claiming three
 * trees per square metre. Three trees per square metre needs 0.58 m spacing,
 * which is not plantable for elm, so the old cell prices were charging for
 * trees that could never go in the ground. Per tree the price is unchanged at
 * USD 10 either way — what changed is that a cell now states how many trees it
 * can really hold. */
const SEEDLINGS_PER_PIT = 3;
const UNIT = { mnt: 100000, usd: 30 };          /* per pit */

/* HOW MANY PITS A CELL HOLDS.
 *
 * Stated, not derived. Pit counts used to come out of area ÷ 1.5 m spacing,
 * which made the site's capacity a consequence of a drawing rather than a
 * decision — and gave 2,019 pits when the programme is sized at 9,000.
 *
 * The site holds 9,000 pits across 53 cells. Fifty-four are drawn; A-01 is the
 * Jack's Coffee land art, which is planted in the shape of their mark and is
 * not sold or counted here, so it is not one of the 53.
 *
 * The split is in proportion to cell area, so a bigger cell still holds more,
 * with the rounding resolved so the total is exactly 9,000 rather than nearly:
 *
 *   A  2 cells × 863 = 1,726        D   8 × 194 = 1,552
 *   B  4 cells × 562 = 2,248        E  15 ×  98 = 1,470
 *   C  6 cells × 259 = 1,554        F  18 ×  25 =   450
 *                                   ── 53 cells = 9,000 pits
 *
 * 9,000 pits · 27,000 seedlings · 9,000 certificates, one per pit.
 */
/* One entry per hexagon. The code is a letter, not a size class, so the count
   cannot be worked out from it — it is stated. Every number here also appears
   in the map's own PITS table; they are checked against each other by the fact
   that both are generated from the same source.

   AH is the Jack's Coffee cell and is NOT part of the 9,000: it is planted in
   the shape of their mark, sold a cup at a time on their own site, and listed
   here only so the map can draw it. */
const PITS = {
    A:25, B:98, C:25, D:25, E:194, F:25, G:25, H:98, I:25,
    J:194, K:562, L:98, M:25, N:25, O:98, P:259, Q:98, R:259,
    S:194, T:98, U:25, V:25, W:98, X:25, Y:98, Z:25, AA:98,
    AB:562, AC:259, AD:194, AE:259, AF:98, AG:25, AH:863, AI:98, AJ:25,
    AK:194, AL:562, AM:863, AN:194, AO:98, AP:25, AQ:25, AR:194, AS:863,
    AT:98, AU:98, AV:194, AW:25, AX:98, AY:259, AZ:259, BA:562, BB:25
};
const TOTAL_PITS = 9000;
const MAX_QTY = TOTAL_PITS;                     /* nobody can buy more than exists */

/* Not for sale through the map, and not part of the 9,000. Jack's Coffee is
 * bought a cup at a time on their own site; a pit here would sell the same
 * ground twice. Enforced on the server, not only hidden in the map — the API is
 * what decides. */
const NOT_FOR_SALE = { "AH": "the Jack's Coffee land art" };

/* One SKU. The whole-cell SKUs are gone: they were keyed by size class, and a
 * code that no longer carries a class cannot address one — nor is a cell sold
 * whole any more, since the buyer picks a number of pits from the cell they
 * clicked on the map. */
const CATALOG = {
    "pit": { perUnit: true, label: "planting pits", mnt: UNIT.mnt, usd: UNIT.usd },
};

/* Cell codes are one or two letters, A…Z then AA…BB. The table above says how
 * many pits each holds — nobody may buy more from a cell than exist in it — and
 * a cell that is not for sale reports no capacity at all. */
function cellCapacity(code) {
    if (typeof code !== "string") return null;
    const c = code.toUpperCase();
    if (!/^[A-Z]{1,2}$/.test(c)) return null;
    if (NOT_FOR_SALE[c]) return null;
    return Object.prototype.hasOwnProperty.call(PITS, c) ? PITS[c] : null;
}

/* 496 = MNT, 840 = USD, per the integration document. */
const CURRENCY = { MNT: "496", USD: "840" };

/* Quantity is only honoured for per-unit items, and is bounded. Without the
 * bound a request for a billion pits produces an invoice for a number the
 * provider may or may not reject, and nobody wants to find out which. */
function priceOf(sku, currency, quantity) {
    const item = CATALOG[sku];
    if (!item) return null;

    let qty = 1;
    if (item.perUnit) {
        qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    }

    const unit = currency === "USD" ? item.usd : item.mnt;
    const amount = unit * qty;
    const trees = (item.perUnit ? qty : item.pits) * SEEDLINGS_PER_PIT;
    const label = item.perUnit
        ? qty.toLocaleString("en-US") + (qty === 1 ? " planting pit" : " planting pits") +
          " · " + trees.toLocaleString("en-US") + " seedlings"
        : item.label;
    return { label: label, amount: amount, quantity: qty, trees: trees,
             currency: CURRENCY[currency] || CURRENCY.MNT };
}

/* Asks the provider what actually happened to a transaction.
 *
 * This is the only trustworthy account of a payment. A callback arrives over
 * the open internet and says what it likes; this asks the provider directly,
 * authenticated as the merchant. Used by pay-status to answer the payer, and by
 * pay-callback to check a claimed payment before any pit is marked sold.
 *
 * Returns { reached, status }. The two must not be conflated: "the provider
 * says there is no such transaction" is a definite no and must block a sale,
 * while "we could not ask" is an absence of information. Treating a denial as
 * an outage would let a forged callback through on the fallback path.
 *
 * An HTTP-level failure means we did not get an answer. A well-formed answer
 * that refuses the lookup — an unknown reference, a wrong merchant code — is an
 * answer, and the answer is no.
 *
 * "003 — Инвойс олдсонгүй" means the reference does not belong to the merchant
 * code doing the asking. It reads like a fault in the endpoint and is not one:
 * looking up an invoice raised by the live merchant while authenticated as the
 * test merchant returns exactly this, which is correct and is the answer we
 * want. A lookup that succeeds returns 000 with entity.status — null while the
 * invoice is unpaid, "000" once it is paid.
 */
async function checkTxn(cfg, token, ref) {
    const r = await call(
        cfg.base + "/checkTxn/" + encodeURIComponent(cfg.merchantCode) + "/" + encodeURIComponent(ref),
        { method: "POST", headers: { Authorization: "Bearer " + token } }
    );
    if (!r.ok || !r.body) {
        console.error("minu status check unreachable:", { httpStatus: r.httpStatus, reference: ref });
        return { reached: false, status: undefined };
    }
    if (r.body.status !== "000") {
        console.warn("minu has no such transaction:", {
            status: r.body.status, message: r.body.message, reference: ref,
        });
        return { reached: true, status: null };
    }
    return { reached: true, status: r.body.entity ? r.body.entity.status : null };
}

module.exports = { config, describeMissing, call, login, checkTxn, priceOf, cellCapacity, CATALOG, CURRENCY,
                   UNIT, MAX_QTY, SEEDLINGS_PER_PIT, PITS, TOTAL_PITS, NOT_FOR_SALE };
