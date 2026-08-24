/* Ends the session by expiring the cookie.
 *
 * Nothing is stored server-side to delete: the session is the signed cookie
 * itself, so clearing it in the browser is the whole of signing out.
 */

const { COOKIE } = require("./_members");

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
    return res.status(200).json({ ok: true });
};
