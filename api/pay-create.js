/* Creates a hosted payment page and hands the browser only its URL.
 *
 * The browser sends a SKU. It does not send a price, a merchant code, or a
 * token, and it receives none of those back. Everything secret stays inside
 * this function's environment.
 */

const { config, describeMissing, call, login, priceOf, cellCapacity } = require("./_minu");
const ledger = require("./_ledger");
const sheet = require("./_sheet");

/* Payments are same-origin only. contact.js allows "*", which is harmless for a
 * message form and wrong here: an open payment endpoint lets any site create
 * invoices against this merchant account. */
const ALLOWED = ["https://land-art.space", "https://www.land-art.space"];

/* Catches a typo, not a fake address — the confirmation email is what proves
 * an address is real. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function siteOrigin(req) {
    const origin = req.headers.origin;
    if (origin && ALLOWED.indexOf(origin) > -1) return origin;
    return ALLOWED[0];
}

/* Reference numbers must be unique per transaction and at most 100 characters.
 * Built from time plus randomness so two visitors clicking together cannot
 * collide, and so it carries no customer data. */
function reference() {
    const t = Date.now().toString(36);
    const r = Math.random().toString(36).slice(2, 10);
    return ("LA-" + t + "-" + r).toUpperCase().slice(0, 100);
}

module.exports = async function handler(req, res) {
    const origin = siteOrigin(req);
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { cfg, missing } = config();
    if (missing.length) {
        console.error("payment is misconfigured — set these in Vercel for Production:", describeMissing(missing));
        return res.status(500).json({ error: "Card payment isn't configured yet. Please email hello@shambala.today." });
    }

    const body = req.body || {};
    const sku = typeof body.sku === "string" ? body.sku : "";
    const currency = body.currency === "USD" ? "USD" : "MNT";

    /* The buyer's name and email are required, and are collected here rather
       than at the bank. The provider returns only a reference, a status and its
       own transaction id — no customer details at all — so if we do not ask
       now, a completed payment leaves us unable to say who bought it. The Terms
       of Purchase undertake to issue confirmation to a Registered Email and to
       report on growth annually for ten years; neither is possible without it. */
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 160) : "";
    if (!name) return res.status(400).json({ error: "Please give a name for the sponsorship." });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Please give a valid email address." });

    /* priceOf rejects a quantity that is not a whole number in range, so a
       fractional, negative or absurd count never reaches the provider. */
    const price = priceOf(sku, currency, body.quantity);
    if (!price) {
        return res.status(400).json({ error: "Unknown item or quantity." });
    }

    /* Pits may be bought from a named cell. The cap is the cell's own pit count
       — otherwise someone could buy 200 pits from a cell that holds five, and
       we would owe trees there is no ground for. */
    let cellCode = null;
    if (sku === "pit" && body.cell !== undefined && body.cell !== null && body.cell !== "") {
        const cap = cellCapacity(body.cell);
        if (cap === null) return res.status(400).json({ error: "Unknown cell." });
        if (price.quantity > cap) {
            return res.status(400).json({ error: "That cell holds " + cap + " pits." });
        }
        cellCode = String(body.cell).toUpperCase();
    }

    const ref = reference();

    /* Hold the pits before creating the invoice. Reserving after would let two
       people pay for the same ground. The reservation expires on its own if the
       payer walks away from the bank's page. */
    if (cellCode) {
        const held = await ledger.reserve(cellCode, price.quantity, ref, cellCapacity(cellCode));
        if (!held.ok) {
            return res.status(409).json({
                error: held.remaining > 0
                    ? "Only " + held.remaining + " pits are left in that cell."
                    : "That cell has just sold out.",
                remaining: held.remaining,
            });
        }
    }

    const token = await login(cfg);
    if (!token) {
        if (cellCode) await ledger.release(ref);
        return res.status(502).json({ error: "Couldn't reach the payment provider. Please try again shortly." });
    }
    const invoiceRes = await call(cfg.base + "/invoice", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
            referenceNumber: ref,
            amount: price.amount,
            merchantCode: cfg.merchantCode,
            currency: price.currency,
            /* Both must be absolute and on our own domain. The webhook is where
               the provider posts the result; the redirect is where the payer's
               browser lands afterwards. */
            webhook: origin + "/api/pay-callback",
            /* Explicit .html: Vercel does not serve extensionless paths unless
               cleanUrls is turned on, and turning it on would change every URL
               on the site. A payer must never land on a 404. */
            redirectUtl: origin + "/payment-complete.html?ref=" + encodeURIComponent(ref),
        }),
    });

    const entity = invoiceRes.body && invoiceRes.body.entity;
    if (!invoiceRes.ok || !invoiceRes.body || invoiceRes.body.status !== "000" || !entity || !entity.invoice) {
        console.error("minu invoice rejected:", {
            httpStatus: invoiceRes.httpStatus,
            status: invoiceRes.body && invoiceRes.body.status,
            message: invoiceRes.body && invoiceRes.body.message,
            reference: ref,
        });
        /* No invoice means no payment will ever arrive for this reference, so
           the pits must go back immediately rather than sit held for 30 min. */
        if (cellCode) await ledger.release(ref);
        return res.status(502).json({ error: "Couldn't start the payment. Please try again shortly." });
    }

    /* The provider returns the invoice URL without a scheme in their examples. */
    const invoice = /^https?:\/\//i.test(entity.invoice) ? entity.invoice : "https://" + entity.invoice;

    console.log("payment invoice created:", { reference: ref, sku: sku, cell: cellCode,
                                          qty: price.quantity, currency: currency });

    /* Record the order before the payer leaves for the bank. A row that exists
       from this moment can be chased if the callback never arrives; a payment
       with no name and no email cannot. Awaited so a slow sheet delays the
       redirect rather than losing the row, but a failure never blocks payment. */
    const record = {
        reference: ref, name: name, email: email, cell: cellCode,
        pits: price.quantity, amount: price.amount, currency: currency,
    };
    /* Хоёр газарт: сан ба хүснэгт. Нэг нь унасан ч захиалга үлдэнэ, аль нэг нь
       тохируулагдаагүй ч нөгөө нь ажиллана. */
    try { await ledger.saveOrder(record); }
    catch (err) { console.error("order not saved to the ledger:", ref, err && err.message); }
    try { await sheet.recordOrder(record); }
    catch (err) { console.error("order not recorded in the sheet:", ref, err && err.message); }

    /* Only these three fields cross back to the browser. No token, no merchant
       code, no credentials. */
    return res.status(200).json({ invoice: invoice, reference: ref,
                                 label: price.label + (cellCode ? " · cell " + cellCode : "") });
};
