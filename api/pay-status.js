/* Checks a transaction's status by reference number.
 *
 * The merchant code is part of the provider's URL path, so this lookup has to
 * happen server-side or the code would have to be published to the browser.
 * The browser sends only the reference it was given and gets back a plain word.
 */

const { config, describeMissing, call, login } = require("./_minu");
const ledger = require("./_ledger");
const { settle } = require("./_settle");

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

    /* Deliberately narrow: a word, the reference, and what was bought. The
       provider's transaction id and raw payload stay on the server, and so do
       the buyer's email and phone number — the page needs neither, and a
       reference is not a credential worth handing personal details to.
       The certificate name and the tree numbers are the exception, and only
       once the payment is real: they are exactly what the certificate prints,
       the buyer chose the name for that purpose, and the certificate is meant
       to be shared. */
    const state = readableStatus(entity && entity.status);

    /* Record what we just learned.
     *
     * A payment is written down when the provider's webhook arrives, or when
     * the buyer's browser is redirected back. Both can fail — a webhook is
     * refused if the key on the invoice no longer matches, a browser gets
     * closed — and when both fail nothing ever tries again. The payment stays
     * pending for ever while the money is long gone.
     *
     * But this endpoint is the third witness, and the one that almost always
     * shows up: the thank-you page polls it six times over half a minute, and
     * every one of those calls asks the provider directly. It has been throwing
     * that answer away. Now it keeps it.
     *
     * Only ever acts on the provider's own verdict, which is the same standard
     * settle() holds every other path to — this is not the browser being
     * believed, it is the provider being asked. Safe to run on every poll:
     * settle() is idempotent and the notification is claimed once. */
    let order = await ledger.readOrder(ref);
    const stored = order && order.status;
    if (state !== "pending" && stored !== state) {
        try {
            await settle(ref, entity && entity.status, entity && entity.txnId,
                         entity && entity.type, "status poll", false);
            order = await ledger.readOrder(ref);
        } catch (err) {
            /* Reporting the status matters more than recording it; the buyer is
               waiting on this response and reconciliation can catch the rest. */
            console.error("could not settle", ref, "from a status poll:", err && err.message);
        }
    }
    const cert = (state === "paid" && order && order.treeFirst)
        ? { name: order.certName || order.name || "",
            first: order.treeFirst, last: order.treeLast,
            /* The cell code the certificate is numbered under — D-06-0007. */
            prefix: order.treePrefix || order.cell || "LA" }
        : null;
    return res.status(200).json({
        reference: ref,
        status: state,
        order: order ? { cell: order.cell || null, pits: order.pits || null,
                         seedlings: order.seedlings || null } : null,
        certificate: cert,
    });
};
