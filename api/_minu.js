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
const SPACING_M = 1.5;
const AREA_PER_PIT = SPACING_M * SPACING_M;     /* 2.25 m² */
const SEEDLINGS_PER_PIT = 3;
const UNIT = { mnt: 100000, usd: 30 };          /* per pit */
const MAX_QTY = 4000;                           /* ~9,000 m², more than the planted area */

/* Whole-cell prices are derived, never typed in, so they cannot drift away from
 * the unit price the way the old hand-written table did. */
function cell(area) {
    const pits = Math.floor(area / AREA_PER_PIT);
    /* Described in pits and seedlings, not square metres. The area is only kept
       to derive the pit count and to draw the hexagon; it is not the unit of
       sale and is not shown to a buyer. */
    return { label: "Cell · " + pits + " pits · " + (pits * SEEDLINGS_PER_PIT) + " elms",
             area: area, pits: pits, trees: pits * SEEDLINGS_PER_PIT,
             mnt: pits * UNIT.mnt, usd: pits * UNIT.usd };
}


const CATALOG = {
    /* Priced by the pit; the buyer chooses how many. */
    "pit": { perUnit: true, label: "planting pits", mnt: UNIT.mnt, usd: UNIT.usd },
    /* Whole HEXAGON cells, as offered on the purchase map. */
    "cell-A": cell(400), "cell-B": cell(260), "cell-C": cell(120),
    "cell-D": cell(90),  "cell-E": cell(45),  "cell-F": cell(12),
};

/* Cell codes look like A-01 … F-18. The letter gives the class, and the class
 * gives how many pits that cell holds — nobody may buy more pits from a cell
 * than exist in it. */
function cellCapacity(code) {
    if (typeof code !== "string" || !/^[A-F]-\d{2}$/.test(code)) return null;
    const c = CATALOG["cell-" + code.charAt(0)];
    return c ? c.pits : null;
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
                   UNIT, MAX_QTY, SPACING_M, AREA_PER_PIT, SEEDLINGS_PER_PIT };
