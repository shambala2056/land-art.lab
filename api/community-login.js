/* Sign-in for the HEXAGON community.
 *
 * An organisation with a tree standing on the installation is already a member;
 * this only proves which one is at the keyboard. The site is a public static
 * build in a public repository, so a credential compared in the browser is not
 * a gate — it ships in the page source and in git history. The check therefore
 * happens here, against COMMUNITY_MEMBERS, which is set in Vercel and never
 * committed. See api/_members.js for the format.
 *
 * WHEN NOT CONFIGURED every sign-in is refused with a message saying so, rather
 * than falling back to a default password. A gate that opens for a value anyone
 * can read from the repository is worse than one that is honestly closed.
 *
 * The session is an httpOnly signed cookie: page scripts cannot read it, so a
 * script injection cannot lift it, and it carries only who signed in — no
 * secret — with an HMAC so it cannot be edited by hand.
 */

const crypto = require("crypto");
const { COOKIE, members, sign } = require("./_members");

const MAX_AGE_SECONDS = 60 * 60 * 12; // a working day, then sign in again

/* Comparing with === leaks how many characters matched through how long it
 * takes. timingSafeEqual does not, but throws on a length mismatch, so hash
 * both sides to a fixed width first. */
function sameSecret(a, b) {
    const ha = crypto.createHash("sha256").update(String(a)).digest();
    const hb = crypto.createHash("sha256").update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).end();
    }
    if (req.method !== "POST") {
        return res.status(405).json({ error: "method", message: "Method not allowed" });
    }

    const secret = process.env.COMMUNITY_SECRET;
    const list = members();

    if (!secret || list.length === 0) {
        // Say plainly that the gate is unconfigured. Pretending the password was
        // wrong would send the operator hunting for the wrong problem.
        return res.status(503).json({
            error: "not-configured",
            message: "Community sign-in is not configured. Set COMMUNITY_MEMBERS and COMMUNITY_SECRET in Vercel.",
        });
    }

    const { username, password } = req.body || {};

    if (!username || typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ error: "no-username", message: "Enter your member name." });
    }
    if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "no-password", message: "Enter your password." });
    }

    const found = list.find((m) => m.username.toLowerCase() === username.trim().toLowerCase());

    // Check a password either way, so an unknown member and a wrong password
    // take the same time and cannot be told apart from outside.
    const ok = found ? sameSecret(found.password, password) : (sameSecret("no-such-member", password), false);

    if (!ok) {
        return res.status(401).json({ error: "invalid", message: "Member name or password is incorrect." });
    }

    const token = sign(
        { u: found.username, n: found.org, c: found.country, iat: Math.floor(Date.now() / 1000) },
        secret
    );

    res.setHeader(
        "Set-Cookie",
        `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`
    );

    return res.status(200).json({
        ok: true,
        member: { username: found.username, org: found.org, country: found.country },
    });
};
