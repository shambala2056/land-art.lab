/* Checks a transaction's status by reference number.
 *
 * The merchant code is part of the provider's URL path, so this lookup has to
 * happen server-side or the code would have to be published to the browser.
 * The browser sends only the reference it was given and gets back a plain word.
 */

const { config, describeMissing, call, login } = require("./_minu");

const ALLOWED = ["https://land-art.space", "https://www.land-art.space"];

/* Provider codes, from the integration document:
 *   000 paid · 011 cancelled · 010 expired · null not paid · anything else failed */
function readableStatus(code) {
    if (code === "000") return "paid";
    if (code === "011") return "cancelled";
    if (code === "010") return "expired";
    if (code === null || code === undefined || code === "") return "pending";
    return "failed";
}

module.exports = async function handler(req, res) {
    const origin = ALLOWED.indexOf(req.headers.origin) > -1 ? req.headers.origin : ALLOWED[0];
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { cfg, missing } = config();
    if (missing.length) {
        console.error("payment is misconfigured — set these in Vercel for Production:", describeMissing(missing));
        return res.status(500).json({ error: "Card payment isn't configured yet." });
    }

    const ref = (req.body && typeof req.body.reference === "string") ? req.body.reference.trim() : "";
    /* Constrain the shape before putting it in a URL path: our own references
       are A-Z, 0-9 and hyphens, so anything else is not one of ours. */
    if (!ref || ref.length > 100 || !/^[A-Z0-9-]+$/i.test(ref)) {
        return res.status(400).json({ error: "Bad reference." });
    }

    const token = await login(cfg);
    if (!token) return res.status(502).json({ error: "Couldn't reach the payment provider." });

    const r = await call(
        cfg.base + "/checkTxn/" + encodeURIComponent(cfg.merchantCode) + "/" + encodeURIComponent(ref),
        { method: "POST", headers: { Authorization: "Bearer " + token } }
    );

    const entity = r.body && r.body.entity;
    if (!r.ok || !r.body || r.body.status !== "000") {
        console.error("minu status check rejected:", {
            httpStatus: r.httpStatus,
            status: r.body && r.body.status,
            message: r.body && r.body.message,
            reference: ref,
        });
        return res.status(502).json({ error: "Couldn't check that payment." });
    }

    /* Deliberately narrow: a word and the reference. The provider's transaction
       id and raw payload stay on the server. */
    return res.status(200).json({
        reference: ref,
        status: readableStatus(entity && entity.status),
    });
};
