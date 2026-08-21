/* Where the buyer's browser lands after paying.
 *
 * This is the "redirectUtl" given on the invoice. The provider sends the
 * browser here by GET with the result in the query string:
 *
 *     .../referenceNumber=a40&status=success&code=200
 *
 * Note the separator in their own example is a slash, not a question mark, so
 * the address we are sent to may be either shape. vercel.json rewrites the
 * slash form onto this function; both are parsed below. Guessing wrong is what
 * sent the first live buyer to a 404 instead of a thank-you page.
 *
 * It settles the payment before redirecting. That matters more than the page it
 * ends on: the server-to-server callback is the intended record, and when it
 * does not arrive — misconfigured, unreachable, never enabled for card
 * transactions — this is the only other moment the sale can be recorded. The
 * buyer's browser becomes the messenger of last resort.
 *
 * Nothing here is trusted. The query string is a URL a browser was pointed at,
 * so the status is taken from the provider's own record, not from what the URL
 * claims. A hand-typed "status=success" buys nothing.
 */

const { settle } = require("./_settle");

/* The reference may arrive under any of several names — ours on the way out,
 * theirs on the way back, and their document spells its own field two different
 * ways. Take the first that looks like one of our references rather than
 * insisting on a name. */
function findReference(q) {
    const named = [q.ref, q.referenceNumber, q.refereneceNumber, q.reference];
    for (const v of named) {
        if (typeof v === "string" && /^LA-[A-Z0-9-]{4,}$/i.test(v.trim())) return v.trim();
    }
    /* Last resort: a reference anywhere in the raw query, including inside the
       path remainder the rewrite hands over. */
    const hay = Object.keys(q).map((k) => k + "=" + q[k]).join("&");
    const m = hay.match(/LA-[A-Z0-9]{6,}-[A-Z0-9]{6,}/i);
    return m ? m[0] : null;
}

/* Their example says status=success; their callback uses numeric codes. Accept
 * both readings, then let the provider's own record overrule either. */
function claimedCode(q) {
    const s = String(q.status || "").toLowerCase();
    if (s === "success" || s === "000" || String(q.code) === "200") return "000";
    if (s === "cancel" || s === "cancelled" || s === "011") return "011";
    if (s === "expired" || s === "010") return "010";
    return s ? "004" : null;
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const q = Object.assign({}, req.query || {});
    /* The rewrite passes the path remainder as one string; unpack it so a
       reference or status sitting in there is seen like any other parameter. */
    if (typeof q.extra === "string" && q.extra) {
        for (const pair of q.extra.split(/[&/]/)) {
            const i = pair.indexOf("=");
            if (i > 0) {
                const k = decodeURIComponent(pair.slice(0, i));
                if (!(k in q)) q[k] = decodeURIComponent(pair.slice(i + 1));
            }
        }
    }

    const reference = findReference(q);
    const claimed = claimedCode(q);

    console.log("payment return:", { reference: reference, claimed: claimed, query: Object.keys(q) });

    let state = "unknown";
    if (reference) {
        try {
            state = await settle(reference, claimed, q.txnId || q.tnxId, q.type, "browser return");
        } catch (err) {
            /* A failure to record must still land the buyer somewhere sensible.
               The page asks the provider again on its own. */
            console.error("could not settle", reference, "on the return path:", err && err.message);
        }
    }

    const to = "/payment-complete.html" +
               (reference ? "?ref=" + encodeURIComponent(reference) +
                            (state !== "unknown" ? "&state=" + encodeURIComponent(state) : "") : "");
    res.statusCode = 303;          /* See Other: the browser follows with GET. */
    res.setHeader("Location", to);
    res.end();
};
