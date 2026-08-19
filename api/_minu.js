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
 * The published offer is one cell = one square metre = USD 30, and the site's
 * own cost breakdown adds to exactly that. The MNT figure is the same unit the
 * HEXAGON classes already use — cell A is ₮40,000,000 for 400 m² and cell F is
 * ₮1,200,000 for 12 m², both ₮100,000/m² — so the two models on the site agree
 * rather than quietly disagreeing. */
const UNIT = { mnt: 100000, usd: 30 };          /* per square metre */
const MAX_QTY = 10000;                          /* the whole hectare */

const CATALOG = {
    /* Priced by the square metre; the buyer chooses how many. */
    "m2": { perUnit: true, label: "m² sponsored", mnt: UNIT.mnt, usd: UNIT.usd },
    /* Whole HEXAGON cells, as offered on the purchase map. */
    "cell-A": { label: "Cell · 400 m²", mnt: 40000000, usd: 12000 },
    "cell-B": { label: "Cell · 260 m²", mnt: 26000000, usd: 7800 },
    "cell-C": { label: "Cell · 120 m²", mnt: 12000000, usd: 3600 },
    "cell-D": { label: "Cell · 90 m²",  mnt: 9000000,  usd: 2700 },
    "cell-E": { label: "Cell · 45 m²",  mnt: 4500000,  usd: 1350 },
    "cell-F": { label: "Cell · 12 m²",  mnt: 1200000,  usd: 360 },
};

/* 496 = MNT, 840 = USD, per the integration document. */
const CURRENCY = { MNT: "496", USD: "840" };

/* Quantity is only honoured for per-unit items, and is bounded. Without the
 * bound a request for a billion square metres produces an invoice for a number
 * the provider may or may not reject, and nobody wants to find out which. */
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
    const label = item.perUnit ? qty.toLocaleString("en-US") + " " + item.label : item.label;
    return { label: label, amount: amount, quantity: qty,
             currency: CURRENCY[currency] || CURRENCY.MNT };
}

module.exports = { config, describeMissing, call, login, priceOf, CATALOG, CURRENCY, UNIT, MAX_QTY };
