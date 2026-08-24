/* An organisation's own entry in the community directory.
 *
 * GET  returns the signed-in member's profile, or an empty one to fill in.
 * POST saves it.
 *
 * Only the signed-in member's own profile is readable or writable here — the
 * username comes from the verified session cookie, never from the request body,
 * so one member cannot write over another's entry by naming it.
 *
 * What an organisation publishes about itself is its own decision, which is why
 * `visible` defaults to false: a profile appears in the directory only once its
 * owner has chosen to list it.
 */

const { session, getProfile, putProfile, storeConfigured } = require("./_members");

const LIMITS = { org: 120, country: 60, sector: 80, about: 600, offering: 400, seeking: 400, contact: 160, website: 200 };

function clean(value, max) {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim().slice(0, max);
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).end();
    }

    const member = session(req);
    if (!member) {
        return res.status(401).json({ error: "signed-out", message: "Sign in to edit your profile." });
    }

    if (!storeConfigured()) {
        return res.status(503).json({
            error: "no-store",
            message: "Profile storage is not connected. Add an Upstash Redis store in Vercel and redeploy.",
        });
    }

    if (req.method === "GET") {
        const profile = (await getProfile(member.u)) || {
            username: member.u,
            org: member.n || "",
            country: "",
            sector: "",
            about: "",
            offering: "",
            seeking: "",
            contact: "",
            website: "",
            visible: false,
        };
        return res.status(200).json({ ok: true, profile });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "method", message: "Method not allowed" });
    }

    const b = req.body || {};
    const profile = {
        username: member.u,
        org: clean(b.org, LIMITS.org) || member.n || member.u,
        country: clean(b.country, LIMITS.country),
        sector: clean(b.sector, LIMITS.sector),
        about: clean(b.about, LIMITS.about),
        offering: clean(b.offering, LIMITS.offering),
        seeking: clean(b.seeking, LIMITS.seeking),
        contact: clean(b.contact, LIMITS.contact),
        website: clean(b.website, LIMITS.website),
        visible: b.visible === true,
        updatedAt: new Date().toISOString(),
    };

    const saved = await putProfile(member.u, profile);
    if (!saved) {
        return res.status(502).json({ error: "save-failed", message: "Could not save. Try again." });
    }

    return res.status(200).json({ ok: true, profile });
};
