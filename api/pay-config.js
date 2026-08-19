/* Tells the page whether card payment is switched on.
 *
 * Nothing secret is disclosed: the answer is a boolean and the published unit
 * price, both of which are already on the cell map. It exists so the checkout
 * can hide itself rather than offer a visitor a button that fails — a payment
 * form that errors on every click is worse than no payment form, and until the
 * merchant credentials are set in Vercel that is exactly what it would be.
 */

const { config, UNIT, MAX_QTY } = require("./_minu");

const ALLOWED = ["https://land-art.space", "https://www.land-art.space"];

module.exports = async function handler(req, res) {
    const origin = ALLOWED.indexOf(req.headers.origin) > -1 ? req.headers.origin : ALLOWED[0];
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    /* Short cache: long enough to spare the function on a busy page, short
       enough that switching payments on shows up without a redeploy wait. */
    res.setHeader("Cache-Control", "public, max-age=60");

    if (req.method === "OPTIONS") return res.status(204).end();

    const { cfg, missing } = config();

    return res.status(200).json({
        available: missing.length === 0,
        /* Sandbox is worth surfacing: it lets the page say plainly that no real
           card will be charged, instead of quietly taking a test payment while
           looking exactly like the real thing. */
        sandbox: /oncom-test/.test(cfg.base),
        unit: { mnt: UNIT.mnt, usd: UNIT.usd },
        maxQuantity: MAX_QTY,
    });
};
