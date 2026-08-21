/* Receives the payment result the provider posts to us.
 *
 * This endpoint is publicly reachable, so anyone on the internet can POST to it
 * claiming a payment succeeded. Three things stand in the way, in order of how
 * much they are relied upon:
 *
 *   1. A secret in the webhook URL (MINU_WEBHOOK_KEY). The provider takes the
 *      webhook address from each invoice we raise rather than from an account
 *      setting, so it has nowhere to enter a username and password — a URL
 *      secret is the only credential it can carry. Compared timing-safely.
 *
 *   2. HTTP Basic Auth (MINU_CALLBACK_USER / MINU_CALLBACK_PASS). Kept because
 *      it costs nothing and covers the case where the provider is configured to
 *      send credentials after all. Either mechanism alone is sufficient.
 *
 *   3. The provider's own account of the transaction. Before a single pit is
 *      marked sold, this asks the provider directly whether that reference was
 *      really paid. This is what actually protects the money: a forged callback
 *      that guessed the URL still cannot invent a payment, because the answer
 *      comes from the provider over our authenticated merchant session and not
 *      from whoever sent the request.
 *
 * The provider's credentials for calling us are separate from the ones we use
 * to call them. Reusing MINU_USERNAME/MINU_PASSWORD here would mean a bug in
 * this handler could expose the credentials that move money.
 */

const crypto = require("crypto");
/* Recording the payment lives in _settle, shared with the browser-return path.
 * Either can be the first — or the only — way a payment reaches us. */
const { settle } = require("./_settle");

/* Compares without leaking length or position through timing. A plain ===
 * returns early on the first wrong byte, which is enough to guess a secret one
 * character at a time. */
function safeEqual(a, b) {
    const ab = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ab.length !== bb.length) {
        /* Still spend the comparison so the mismatch is not timed. */
        crypto.timingSafeEqual(ab, ab);
        return false;
    }
    return crypto.timingSafeEqual(ab, bb);
}

function authorised(req) {
    /* The URL secret first: it is the one the provider can actually present. */
    const key = process.env.MINU_WEBHOOK_KEY;
    if (key) {
        const given = (req.query && (req.query.k || req.query.key)) || "";
        if (given && safeEqual(given, key)) return { ok: true, by: "url-key" };
    }

    const user = process.env.MINU_CALLBACK_USER;
    const pass = process.env.MINU_CALLBACK_PASS;
    /* Unconfigured only if there is no way in at all. With a URL key set, Basic
       Auth being absent is a choice rather than a fault. */
    if (!user || !pass) return { ok: false, reason: key ? "bad-credentials" : "unconfigured" };

    const header = req.headers.authorization || "";
    if (!/^Basic /i.test(header)) return { ok: false, reason: "no-credentials" };

    let decoded = "";
    try { decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8"); }
    catch (e) { return { ok: false, reason: "malformed" }; }

    const i = decoded.indexOf(":");
    if (i < 0) return { ok: false, reason: "malformed" };

    const okUser = safeEqual(decoded.slice(0, i), user);
    const okPass = safeEqual(decoded.slice(i + 1), pass);
    /* Both evaluated before returning, so a wrong username and a wrong password
       take the same time. */
    return { ok: okUser && okPass, by: "basic", reason: "bad-credentials" };
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ status: "001", message: "Method not allowed" });

    const auth = authorised(req);
    if (!auth.ok) {
        if (auth.reason === "unconfigured") {
            console.error("payment callback is misconfigured — set these in Vercel for Production:",
                ["MINU_CALLBACK_USER", "MINU_CALLBACK_PASS"]);
            return res.status(500).json({ status: "001", message: "Not configured" });
        }
        /* Never echo what was sent. */
        console.warn("payment callback rejected:", auth.reason);
        res.setHeader("WWW-Authenticate", 'Basic realm="land-art"');
        return res.status(401).json({ status: "001", message: "Unauthorized" });
    }

    const body = req.body || {};
    const entity = body.entity || body;
    const reference = entity.referenceNumber || entity.refereneceNumber || null;   /* the document spells it both ways */

    /* Everything after this — verifying with the provider, the ledger, the order
       book, the sheet, the notification — is shared with the browser-return
       path, because a payment can reach us down either one and must be recorded
       identically whichever arrives first. See _settle.js. */
    let state = "unknown";
    if (reference) {
        try {
            state = await settle(reference, entity.status, entity.txnId, entity.type, "callback", true);
        } catch (err) {
            /* Never fail the callback on an internal error: a non-200 makes the
               provider retry a payment we have already accepted. */
            console.error("could not settle", reference, "from the callback:", err && err.message);
        }
    }

    console.log("payment callback:", {
        reference: reference,
        claimed: entity.status,
        settled: state,
        by: auth.by,
        txnId: entity.txnId,
        type: entity.type,
    });

    /* The provider expects its own success envelope. */
    return res.status(200).json({ status: "000", message: "Success", entity: null });
};
