/* Receives the payment result the provider posts to us.
 *
 * This endpoint is publicly reachable, so anyone on the internet can POST to it
 * claiming a payment succeeded. It is protected by HTTP Basic Auth using a
 * username and password we choose and give to the provider — stored as
 * environment variables, never in this repository.
 *
 * The provider's own credentials for calling us are separate from the ones we
 * use to call them. Reusing MINU_USERNAME/MINU_PASSWORD here would mean a bug
 * in this handler could expose the credentials that move money.
 */

const crypto = require("crypto");
const { Resend } = require("resend");

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
    const user = process.env.MINU_CALLBACK_USER;
    const pass = process.env.MINU_CALLBACK_PASS;
    if (!user || !pass) return { ok: false, reason: "unconfigured" };

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
    return { ok: okUser && okPass, reason: "bad-credentials" };
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
    const paid = String(entity.status) === "000";

    console.log("payment callback:", {
        reference: reference,
        status: entity.status,
        txnId: entity.txnId,
        type: entity.type,
    });

    /* No database here, so a successful payment is emailed to the team rather
       than silently logged. Failure to notify must not fail the callback: the
       provider retries on a non-200 and would repeat a payment we already have. */
    if (paid && process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL) {
        try {
            await new Resend(process.env.RESEND_API_KEY).emails.send({
                from: process.env.CONTACT_FROM_EMAIL || "Land-Art Lab <onboarding@resend.dev>",
                to: process.env.CONTACT_TO_EMAIL,
                subject: "Payment received — " + (reference || "no reference"),
                text: "Reference: " + reference +
                      "\nProvider transaction: " + entity.txnId +
                      "\nMethod: " + (entity.type || "—") +
                      "\nStatus: " + entity.status,
            });
        } catch (err) {
            console.error("payment received but the notification email failed:", err && err.message);
        }
    }

    /* The provider expects its own success envelope. */
    return res.status(200).json({ status: "000", message: "Success", entity: null });
};
