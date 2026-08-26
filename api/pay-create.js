/* Creates a hosted payment page and hands the browser only its URL.
 *
 * The browser sends a SKU. It does not send a price, a merchant code, or a
 * token, and it receives none of those back. Everything secret stays inside
 * this function's environment.
 */

const { config, describeMissing, call, login, priceOf, cellCapacity, NOT_FOR_SALE } = require("./_minu");
const ledger = require("./_ledger");
const sheet = require("./_sheet");

/* Payments are same-origin only. contact.js allows "*", which is harmless for a
 * message form and wrong here: an open payment endpoint lets any site create
 * invoices against this merchant account. */
const ALLOWED = ["https://land-art.space", "https://www.land-art.space"];

/* The addresses put on an invoice are always canonical, never taken from the
 * request. The apex answers every request with a 308 to www — harmless in a
 * browser, and quietly fatal for a callback: server-side HTTP clients commonly
 * refuse to follow a redirect on POST, or follow it having dropped the body.
 * The provider would be calling an address that never delivers, and a payment
 * would complete with nothing recorded, which is exactly what happened. */
const CANONICAL = "https://www.land-art.space";

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

    /* The certificate carries its own name, and it is required. Asked for before
       payment rather than after, because a certificate issued against a
       completed payment cannot be reissued under a different name without
       reopening the question of who the trees belong to — so there is no good
       moment to ask afterwards. */
    const certName = typeof body.certName === "string" ? body.certName.trim().slice(0, 80) : "";
    if (!certName) return res.status(400).json({ error: "Please give the name to print on the certificate." });
    /* Latin only, checked here as well as in the browser. The certificate is set
       in Abril Fatface, which carries no Cyrillic: a Mongolian name typed into
       that field renders as a row of empty boxes on a printed certificate, and
       nobody finds out until it is in someone's hands. Cheaper to refuse the
       order than to reissue the paper. */
    if (!/^[A-Za-z][A-Za-z .'\u2019-]*$/.test(certName)) {
        return res.status(400).json({
            error: "The certificate name must use Latin letters only — please write it as it is spelled in a passport.",
        });
    }

    /* Required too. The confirmation and the annual report go by email; the
       number is what makes a person reachable when an address bounces and a
       certificate is owed. Checked for a plausible amount of digits rather than
       a format — a validator strict enough to catch a typo also rejects
       legitimate international numbers, and that costs more than it saves. */
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
    if ((phone.match(/\d/g) || []).length < 6) {
        return res.status(400).json({ error: "Please give a phone number." });
    }

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
        const asked = String(body.cell).toUpperCase();
        /* Some cells are not on sale here at all. Saying so beats "unknown
           cell", which reads as our mistake rather than as the answer. */
        if (NOT_FOR_SALE[asked]) {
            return res.status(400).json({
                error: "Cell " + asked + " is " + NOT_FOR_SALE[asked] +
                       " and is not sponsored through this map.",
            });
        }
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
               browser lands afterwards.
               The provider reads the webhook address from this invoice rather
               than from an account setting, so there is nowhere for it to enter
               a username and password: the secret travels in the URL, which is
               the only credential the callback can carry. */
            webhook: CANONICAL + "/api/pay-callback" +
                     (process.env.MINU_WEBHOOK_KEY ? "?k=" + encodeURIComponent(process.env.MINU_WEBHOOK_KEY) : ""),
            /* Not the thank-you page directly. The provider appends its result
               to this address — and appends it with a slash, per its own
               example — so a static page with a query string on it becomes a
               path that does not exist, and the buyer's reward for paying is a
               404. pay-return absorbs whatever shape arrives, records the sale
               in case the callback never comes, and forwards to the page. */
            redirectUtl: CANONICAL + "/api/pay-return?ref=" + encodeURIComponent(ref),
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
        reference: ref, name: name, email: email,
        certName: certName, phone: phone, cell: cellCode,
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
