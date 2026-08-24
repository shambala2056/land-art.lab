/* Sign-in for the HEXAGON community area.
 *
 * The site is a public static build served from a public repository, so a
 * credential compared in the browser is not a gate — it ships in the page
 * source and in git history. The check therefore happens here, where the
 * expected values come from environment variables that never leave Vercel.
 *
 * Set in Vercel → Settings → Environment Variables:
 *
 *   COMMUNITY_MEMBERS   one member per line, "username:password:Display Name:role"
 *                       e.g.  coordinator:••••••:Zorigt:coordinator
 *                             field:••••••:Field team:staff
 *   COMMUNITY_SECRET    any long random string; signs the session cookie
 *
 * WHEN NOT CONFIGURED every sign-in is refused with a message saying so, rather
 * than falling back to a default password. A gate that opens for a value
 * committed to a public repo is worse than a gate that is honestly closed.
 *
 * On success this sets an httpOnly cookie. httpOnly means page scripts cannot
 * read it, so a cross-site script injection cannot lift the session. The cookie
 * is signed, not encrypted — it carries no secret, only who signed in and when,
 * plus an HMAC so it cannot be edited by hand.
 *
 * Nothing is gated yet: the member area has not been built. This endpoint
 * establishes the session so that when it is, the pages can require one.
 */

const crypto = require("crypto");

const COOKIE = "las_community";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours — a working day, then sign in again

/* Parses COMMUNITY_MEMBERS. Blank lines and lines starting with # are ignored so
 * the variable can carry comments. */
function readMembers() {
    const raw = process.env.COMMUNITY_MEMBERS;
    if (!raw) return [];
    return raw
        .split(/[\r\n]+/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
            const [username, password, name, role] = line.split(":");
            if (!username || !password) return null;
            return {
                username: username.trim(),
                password: password.trim(),
                name: (name || username).trim(),
                role: (role || "member").trim(),
            };
        })
        .filter(Boolean);
}

/* Comparing with === leaks how many characters matched through how long it
 * takes. timingSafeEqual does not, but it throws on a length mismatch, so pad
 * both sides to a fixed digest first. */
function sameSecret(a, b) {
    const ha = crypto.createHash("sha256").update(String(a)).digest();
    const hb = crypto.createHash("sha256").update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

function sign(payload, secret) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const mac = crypto.createHmac("sha256", secret).update(body).digest("base64url");
    return `${body}.${mac}`;
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).end();
    }
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const secret = process.env.COMMUNITY_SECRET;
    const members = readMembers();

    if (!secret || members.length === 0) {
        // Say plainly that the gate is not configured. Pretending the password
        // was wrong would send the operator hunting for the wrong problem.
        return res.status(503).json({
            error: "not-configured",
            message:
                "Community sign-in is not configured yet. Set COMMUNITY_MEMBERS and COMMUNITY_SECRET in Vercel.",
        });
    }

    const { username, password } = req.body || {};

    if (!username || typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ error: "no-username", message: "Enter your member name." });
    }
    if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "no-password", message: "Enter your password." });
    }

    const found = members.find(
        (m) => m.username.toLowerCase() === username.trim().toLowerCase()
    );

    // Check a password either way, so a missing username and a wrong password
    // take the same time and cannot be told apart from outside.
    const ok = found
        ? sameSecret(found.password, password)
        : (sameSecret("no-such-member", password), false);

    if (!ok) {
        return res
            .status(401)
            .json({ error: "invalid", message: "Member name or password is incorrect." });
    }

    const issued = Math.floor(Date.now() / 1000);
    const token = sign(
        { u: found.username, n: found.name, r: found.role, iat: issued },
        secret
    );

    res.setHeader(
        "Set-Cookie",
        `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`
    );

    return res.status(200).json({
        ok: true,
        member: { name: found.name, role: found.role },
    });
};
