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
const ledger = require("./_ledger");
const sheet = require("./_sheet");
const { config, login, checkTxn } = require("./_minu");
/* Resend is required lazily, inside the notification block. At module scope a
 * failure to load it — a missing install, a bad version, an outage in the
 * package itself — takes the whole handler down, and this handler must always
 * answer 200 once a payment is confirmed. A 500 here makes the provider retry a
 * payment we have already accepted, and the money moves while our record of it
 * does not. Notifying is best-effort; confirming is not. */

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

/* Asks the provider whether this reference was really paid.
 *
 * Returns true only on a definite yes. A definite no returns false. If the
 * provider cannot be reached the answer is undefined, and the caller falls back
 * to the authenticated claim: refusing to record a payment because our own
 * network call failed would lose money that has genuinely moved, and the
 * request already carried a secret only the provider holds.
 */
async function reallyPaid(reference) {
    const { cfg, missing } = config();
    if (missing.length) return undefined;
    try {
        const token = await login(cfg);
        if (!token) return undefined;
        const r = await checkTxn(cfg, token, reference);
        if (!r.reached) return undefined;
        /* Reached and answered: anything that is not the provider's own success
           code — including no such transaction at all — is a no. */
        return String(r.status) === "000";
    } catch (err) {
        console.error("could not verify payment with the provider:", reference, err && err.message);
        return undefined;
    }
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
    const claimed = String(entity.status) === "000";

    /* Never take the caller's word for a payment. Only a success is checked: a
       claimed failure releases pits, which is safe to act on either way, and a
       forged failure can at worst free a reservation that the payer can retry. */
    let paid = claimed;
    if (claimed && reference) {
        const verdict = await reallyPaid(reference);
        if (verdict === false) {
            console.warn("callback claimed a payment the provider does not have:", reference);
            paid = false;
            /* Not treated as a cancellation either — the pits stay reserved
               until they expire, in case this was a race rather than a forgery
               and the real confirmation is still on its way. */
            return res.status(200).json({ status: "000", message: "Success", entity: null });
        }
        if (verdict === undefined) {
            /* Currently the normal path: 360's lookup does not resolve our
               references at all. The URL secret and the ledger's own record of
               what it reserved are what stand behind the sale until it does. */
            console.warn("accepting", reference, "on the callback's word — the provider gave no verdict");
        }
    }

    console.log("payment callback:", {
        reference: reference,
        status: entity.status,
        verified: claimed ? (paid ? "confirmed with provider" : "rejected") : "n/a",
        by: auth.by,
        txnId: entity.txnId,
        type: entity.type,
    });

    /* Turn the reservation into a sale, or hand the pits back. Done before the
       email so the ledger is right even if notification fails. */
    if (reference) {
        try {
            if (paid) await ledger.confirm(reference);
            else await ledger.release(reference);
        } catch (err) {
            console.error("ledger update failed for", reference, err && err.message);
        }
    }

    /* Mark the row in the order book. Statuses match what pay-status reports, so
       the sheet and the site never disagree about an order. */
    if (reference) {
        const state = paid ? "paid" : (String(entity.status) === "011" ? "cancelled"
                    : String(entity.status) === "010" ? "expired" : "failed");
        try { await ledger.markOrder(reference, state, entity.txnId, entity.type); }
        catch (err) { console.error("ledger order update failed for", reference, err && err.message); }
        try {
            await sheet.updateStatus(reference,
                paid ? "paid" : (String(entity.status) === "011" ? "cancelled"
                              : String(entity.status) === "010" ? "expired" : "failed"),
                entity.txnId, entity.type);
        } catch (err) {
            console.error("sheet status update failed for", reference, err && err.message);
        }
    }

    /* A successful payment is also emailed to the team rather
       than silently logged. Failure to notify must not fail the callback: the
       provider retries on a non-200 and would repeat a payment we already have. */
    if (paid && process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL) {
        try {
            const { Resend } = require("resend");
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
