/* The directory of member organisations.
 *
 * Readable only by a signed-in member. The point of the directory is that
 * parties who did not meet at COP17 can find each other here, which requires
 * naming organisations and their contact — information that belongs to the
 * members, not to visitors of a public marketing site.
 *
 * Only profiles their owners marked visible are returned, and a member's own
 * entry is returned regardless so they can see how it will read.
 */

const { session, allProfiles, storeConfigured } = require("./_members");

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        return res.status(204).end();
    }
    if (req.method !== "GET") {
        return res.status(405).json({ error: "method", message: "Method not allowed" });
    }

    const member = session(req);
    if (!member) {
        return res.status(401).json({ error: "signed-out", message: "Sign in to see the directory." });
    }

    if (!storeConfigured()) {
        return res.status(503).json({
            error: "no-store",
            message: "Directory storage is not connected. Add an Upstash Redis store in Vercel and redeploy.",
        });
    }

    const all = (await allProfiles()) || [];

    /* Newest first: the front page reads as a feed of who has joined and what
     * they are starting, so recency is the useful order. The directory view
     * sorts alphabetically in the page, where the reader is looking something
     * up rather than catching up. */
    const listed = all
        .filter((p) => p && (p.visible === true || p.username === member.u))
        .sort((a, b) => String(b.joinedAt || "").localeCompare(String(a.joinedAt || "")));

    return res.status(200).json({
        ok: true,
        me: member.u,
        count: listed.length,
        members: listed,
    });
};
