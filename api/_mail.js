/* The letter the buyer gets once their payment is real.
 *
 * This used to be the Apps Script's job, and it could not do it properly: the
 * script only sees what reaches the sheet, and the tree numbers are handed out
 * here, on the payment side, after the provider confirms. A letter that cannot
 * name the tree is not the letter that was asked for. It also sent as whoever
 * owned the spreadsheet, where this sends as hello@shambala.today.
 *
 * Set in Vercel:
 *   RESEND_API_KEY     the Resend key
 *   BUYER_FROM_EMAIL   optional; defaults to Land-art Space <hello@shambala.today>
 *
 * The sending domain has to be verified in Resend before that From address
 * will leave the building. An unverified domain does not bounce — it is simply
 * rejected at send time, which is why a failure here is logged loudly.
 *
 * MAIL_SINK_URL diverts everything to a local address instead of sending. That
 * is how the whole flow is tested on a laptop without mailing anybody.
 *
 * SEND_TREE_LETTER is the switch, and it is OFF unless it is set to "1". The
 * letter is held back for now while the wording and the certificate artwork are
 * settled, and defaulting to off is deliberate: forgetting to set a variable
 * should mean no mail goes out, never that mail goes out unreviewed. Everything
 * else carries on as before — the numbers are still issued, the confirmation
 * page still shows them, and the certificate is still there to download.
 */

const ledger = require("./_ledger");

/* "R", 51, 52 -> ["R-051", "R-052"] — the same shape the certificate prints,
 * so the number in the letter is the number on the paper. */
function numbersFor(prefix, first, last) {
    const out = [];
    for (let n = first; n <= last; n++) out.push(prefix + "-" + String(n).padStart(3, "0"));
    return out;
}

/* One tree, two, or a hundred — all read naturally.
 * A long block is given as a range: nobody wants forty codes in a sentence. */
function nameThem(codes) {
    if (codes.length === 1) return codes[0];
    if (codes.length === 2) return codes[0] + " and " + codes[1];
    if (codes.length <= 5) return codes.slice(0, -1).join(", ") + " and " + codes[codes.length - 1];
    return codes[0] + " through " + codes[codes.length - 1];
}

/* The letter itself, in the tree's own voice. Kept as the client wrote it —
 * the singular is theirs word for word, and the plural changes only what
 * grammar forces, because a sponsor of two pits should not get a visibly
 * different letter from a sponsor of one. */
function letter(codes) {
    const one = codes.length === 1;
    const who = nameThem(codes);
    return one
        ? "Hello!\n\n" +
          "I am your little Elm tree, number " + who + ". I am greeting you from the eastern " +
          "golden Gobi, the southern frontier of Mongolia☀️. I have arrived here in the " +
          "Gobi region with thousands of my friends to become your " + who + " tree, help reduce " +
          "desertification, and grow alongside you.\n\n" +
          "In just a few years, I will become a large tree where you can sit in my shade. When " +
          "you gaze into the distance and sigh, I will caress you with my leaves and rustle as " +
          "I call the clouds.\n\n" +
          "See you soon in the Gobi.🫂\n\n" +
          "Sincerely,\n" +
          "Your little Elm"
        : "Hello!\n\n" +
          "We are your little Elm trees, numbers " + who + ". We are greeting you from the eastern " +
          "golden Gobi, the southern frontier of Mongolia☀️. We have arrived here in the " +
          "Gobi region with thousands of our friends to become your trees, help reduce " +
          "desertification, and grow alongside you.\n\n" +
          "In just a few years, we will become large trees where you can sit in our shade. When " +
          "you gaze into the distance and sigh, we will caress you with our leaves and rustle as " +
          "we call the clouds.\n\n" +
          "See you soon in the Gobi.🫂\n\n" +
          "Sincerely,\n" +
          "Your little Elms";
}

/* Plain text is what the letter is; the HTML part only carries the same words
 * with the certificate buttons attached, because a link is easier to press than
 * to copy. Both parts say the same thing, so a text-only client loses nothing
 * but the styling. */
function html(codes, certUrl) {
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const body = esc(letter(codes)).split("\n\n").map(
        (p) => '<p style="margin:0 0 18px">' + p.replace(/\n/g, "<br>") + "</p>").join("");
    const btn = (href, label, dark) =>
        '<a href="' + esc(href) + '" style="display:inline-block;text-decoration:none;' +
        "border-radius:100px;padding:13px 26px;font:700 12px/1 Helvetica,Arial,sans-serif;" +
        "letter-spacing:.06em;text-transform:uppercase;margin:0 8px 8px 0;" +
        (dark ? "background:#14150F;color:#ffffff" : "background:#B8E020;color:#14150F") +
        '">' + esc(label) + "</a>";
    return '<div style="font:400 16px/1.65 Helvetica,Arial,sans-serif;color:#14150F;' +
           'background:#F2F0EA;padding:32px 20px">' +
           '<div style="max-width:560px;margin:0 auto;background:#FBFAF6;border-radius:24px;' +
           'padding:36px 32px">' + body +
           (certUrl
             ? '<div style="margin-top:26px;padding-top:22px;border-top:1px solid #E0DACA">' +
               btn(certUrl, "Download certificate", true) +
               btn(certUrl + "&story=1", "Share as story", false) + "</div>"
             : "") +
           '<p style="margin:24px 0 0;font-size:12px;color:#5E5F55">Land-art Space · ' +
           "Shambala Carbon Offsets LLC · Erdene sum, Dornogovi, Mongolia</p>" +
           "</div></div>";
}

/* Whether the letter goes out at all. Read on every call rather than once at
 * module load, so switching it on in Vercel takes effect without a redeploy. */
function enabled() {
    return String(process.env.SEND_TREE_LETTER || "") === "1";
}

/* Sends the letter. Never throws: a payment that succeeded must not be reported
 * as failed because a mail server was slow. Returns true only if it went.
 *
 * Sent once per reference, claimed in the ledger, because a payment settles
 * down two independent paths and both reach this. */
async function sendTreeLetter(order, cert) {
    if (!order || !order.email) return false;
    if (!cert || !cert.prefix || !cert.first) return false;

    /* Held back on purpose. Returning before the claim below matters: the
       "sent once" marker is never written, so when the letter is switched on
       these orders can still be posted rather than being permanently counted
       as already answered. */
    if (!enabled()) {
        console.log("tree letter held — SEND_TREE_LETTER is off:", order.reference);
        return false;
    }

    const codes = numbersFor(cert.prefix, Number(cert.first), Number(cert.last || cert.first));
    if (!codes.length) return false;

    const sink = process.env.MAIL_SINK_URL;
    if (!sink && !process.env.RESEND_API_KEY) {
        console.error("tree letter not sent — no RESEND_API_KEY:", order.reference);
        return false;
    }

    /* Claimed before sending, not after. Sending twice is the failure that
       matters here; a letter lost to a crash between the claim and the send is
       recoverable by hand, two letters to the same buyer are not. */
    try {
        if (!(await ledger.claimOnce("letter:" + order.reference))) return false;
    } catch (err) {
        console.error("could not claim the tree letter for", order.reference, err && err.message);
        return false;
    }

    const base = process.env.PUBLIC_BASE_URL || "https://www.land-art.space";
    const certUrl = base + "/certificate.html?ref=" + encodeURIComponent(order.reference);
    const msg = {
        from: process.env.BUYER_FROM_EMAIL || "Land-art Space <hello@shambala.today>",
        to: order.email,
        subject: "Hello from your Elm tree " + codes[0],
        text: letter(codes) + "\n\n—\nYour certificate: " + certUrl,
        html: html(codes, certUrl),
    };

    try {
        if (sink) {
            /* Local testing: the letter goes to a page instead of a person. */
            await fetch(sink, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.assign({ reference: order.reference,
                                                     codes: codes }, msg)),
            });
            console.log("tree letter (sink):", order.reference, "->", order.email, codes.join(","));
            return true;
        }
        const { Resend } = require("resend");
        const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send(msg);
        if (error) {
            console.error("tree letter rejected by Resend:", order.reference, JSON.stringify(error));
            return false;
        }
        console.log("tree letter sent:", order.reference, "->", order.email, codes.join(","));
        return true;
    } catch (err) {
        console.error("tree letter failed to send:", order.reference, err && err.message);
        return false;
    }
}

module.exports = { sendTreeLetter, enabled, numbersFor, nameThem, letter };
