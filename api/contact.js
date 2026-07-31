const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

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

    try {
        await resend.emails.send({
            from: process.env.CONTACT_FROM_EMAIL || "Land-Art Lab <onboarding@resend.dev>",
            to: process.env.CONTACT_TO_EMAIL,
            reply_to: phone && EMAIL_RE.test(phone) ? phone : undefined,
            subject: `New contact form message from ${name}`,
            text: `Name: ${name}\nPhone/Email: ${phone || "—"}\n\nMessage:\n${message}`,
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("contact form send failed:", err);
        return res.status(502).json({ error: "Couldn't send your message right now. Please try again shortly." });
    }
};
