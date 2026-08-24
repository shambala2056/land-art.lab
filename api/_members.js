/* Who the community is, and how a request proves it is one of them.
 *
 * Membership is not a separate thing to administer: an organisation that has a
 * tree standing on the HEXAGON already belongs. COMMUNITY_MEMBERS is therefore
 * the list of organisations that bought in, one per line, and it is set in
 * Vercel rather than committed — the repository is public.
 *
 *   COMMUNITY_MEMBERS   username:password:Organisation name:country
 *   COMMUNITY_SECRET    long random string; signs the session cookie
 *
 * Profiles live in Upstash Redis, reached over its REST API with plain fetch,
 * the same way api/_ledger.js reaches it. Vercel sets either the KV_* or the
 * UPSTASH_* pair depending on when the store was created; both are read here so
 * the directory does not fail on a variable name.
 *
 * WHEN REDIS IS NOT CONFIGURED profiles cannot be saved and the directory
 * reports itself unavailable. It does not fall back to memory: a serverless
 * function keeps nothing between invocations, so a profile written to memory is
 * a profile the member will find missing on their next visit, which is worse
 * than being told plainly that storage is not connected yet.
 */

const crypto = require("crypto");

const COOKIE = "las_community";
const PREFIX = "las:profile:";

/* ── Members from the environment ───────────────────────────────────── */

function members() {
    const raw = process.env.COMMUNITY_MEMBERS;
    if (!raw) return [];
    return raw
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"))
        .map((line) => {
            const [username, password, org, country] = line.split(":");
            if (!username || !password) return null;
            return {
                username: username.trim(),
                password: password.trim(),
                org: (org || username).trim(),
                country: (country || "").trim(),
            };
        })
        .filter(Boolean);
}

/* ── Session cookie ─────────────────────────────────────────────────── */

function sign(payload, secret) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const mac = crypto.createHmac("sha256", secret).update(body).digest("base64url");
    return `${body}.${mac}`;
}

/* Returns the signed-in member, or null. Verifies the HMAC before trusting any
 * field, so a hand-edited cookie cannot promote itself to another member. */
function session(req) {
    const secret = process.env.COMMUNITY_SECRET;
    if (!secret) return null;

    const header = req.headers && req.headers.cookie;
    if (!header) return null;

    const raw = header
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(COOKIE + "="));
    if (!raw) return null;

    const token = raw.slice(COOKIE.length + 1);
    const dot = token.lastIndexOf(".");
    if (dot < 1) return null;

    const body = token.slice(0, dot);
    const mac = token.slice(dot + 1);
    const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");

    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    try {
        return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    } catch {
        return null;
    }
}

/* ── Upstash Redis over REST ────────────────────────────────────────── */

function store() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return url && token ? { url, token } : null;
}

async function command(args) {
    const s = store();
    if (!s) return null;
    const res = await fetch(s.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && "result" in data ? data.result : null;
}

async function getProfile(username) {
    const raw = await command(["GET", PREFIX + username]);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function putProfile(username, profile) {
    const ok = await command(["SET", PREFIX + username, JSON.stringify(profile)]);
    return ok !== null;
}

/* SCAN rather than KEYS: KEYS blocks the server for the length of the keyspace,
 * which is fine at ten members and not fine later. */
async function allProfiles() {
    if (!store()) return null;
    const out = [];
    let cursor = "0";
    do {
        const page = await command(["SCAN", cursor, "MATCH", PREFIX + "*", "COUNT", "200"]);
        if (!page) break;
        cursor = String(page[0]);
        const keys = page[1] || [];
        for (const k of keys) {
            const raw = await command(["GET", k]);
            if (!raw) continue;
            try {
                out.push(JSON.parse(raw));
            } catch {
                /* a value we cannot read is skipped, not fatal for the listing */
            }
        }
    } while (cursor !== "0");
    return out;
}

module.exports = {
    COOKIE,
    members,
    sign,
    session,
    storeConfigured: () => store() !== null,
    getProfile,
    putProfile,
    allProfiles,
};
