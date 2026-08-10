const { Resend } = require("resend");

// Basic email format check — good enough to catch typos, not meant to be a full RFC validator.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { name, phone, message, website } = req.body || {};

    // Honeypot: a real visitor never fills this hidden field, only bots do.
    if (website) {
        return res.status(200).json({ ok: true });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name is required." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message is required." });
    }
    if (phone && typeof phone === "string" && phone.includes("@") && !EMAIL_RE.test(phone)) {
        return res.status(400).json({ error: "That doesn't look like a valid email." });
    }

    // Built here rather than at module scope: the Resend constructor throws when
    // RESEND_API_KEY is missing, and a throw at module scope takes the whole
    // function down with an opaque 500 on every request — including OPTIONS and
    // GET, which never touch Resend at all. Checked explicitly so a misconfigured
    // environment says so in the logs instead of crashing.
    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !recipient) {
        console.error("contact form is misconfigured — set these in Vercel for Production:", {
            RESEND_API_KEY: apiKey ? "set" : "MISSING",
            CONTACT_TO_EMAIL: recipient ? "set" : "MISSING",
        });
        return res.status(500).json({ error: "The contact form isn't configured right now. Please email hello@shambala.today directly." });
    }

    try {
        const { data, error } = await new Resend(apiKey).emails.send({
            from: process.env.CONTACT_FROM_EMAIL || "Land-Art Lab <onboarding@resend.dev>",
            to: recipient,
            // camelCase: the SDK maps replyTo onto the API's reply_to through an
            // explicit whitelist, so a snake_case key here is silently discarded
            // and every notification arrives with no reply address.
            replyTo: phone && EMAIL_RE.test(phone) ? phone : undefined,
            subject: `New contact form message from ${name}`,
            text: `Name: ${name}\nPhone/Email: ${phone || "—"}\n\nMessage:\n${message}`,
        });

        // The SDK returns API-level rejections in the response instead of throwing,
        // so an unchecked call reports success for mail that was never accepted —
        // the visitor is told it sent while nothing arrives, and nothing is logged.
        if (error) {
            console.error("contact form send rejected by Resend:", error);
            return res.status(502).json({ error: "Couldn't send your message right now. Please try again shortly." });
        }

        console.log("contact form sent:", data && data.id, "->", recipient);
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("contact form send failed:", err);
        return res.status(502).json({ error: "Couldn't send your message right now. Please try again shortly." });
    }
};
