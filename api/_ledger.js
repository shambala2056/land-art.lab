/* Records which pits in which cell have been sold, so a cell cannot be sold
 * twice over.
 *
 * Serverless functions keep nothing between invocations, so this needs storage
 * outside the function. It speaks to Vercel KV (Upstash Redis) over its REST
 * API using fetch, with no dependency to install.
 *
 * Set in Vercel: Storage → Create Database → Upstash → Redis, then Connect it to
 * the project. The variables are set for you; nothing is typed by hand.
 *
 * Vercel used to call this "KV" and set KV_REST_API_URL / KV_REST_API_TOKEN.
 * It is now bought through the Marketplace from Upstash, which sets
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN instead — and which pair
 * appears depends on when the store was created. Both are accepted below so the
 * ledger works either way, rather than failing silently on a name.
 *
 * Note it must be Upstash and not Redis Cloud: this speaks the REST API over
 * plain fetch, and a redis:// connection string cannot be used from a
 * serverless function without a client library.
 *
 * WHEN NOT CONFIGURED the ledger reports itself unavailable and every call is a
 * no-op that permits the sale. That is deliberate: a payment system that stops
 * taking money because a cache is missing is worse than one that occasionally
 * oversells a cell, which a human can reconcile from the notification emails.
 * pay-availability tells the map which case it is, so the site never shows a
 * remaining count it cannot stand behind.
 *
 * Three keys per cell:
 *   sold:{cell}   integer, pits confirmed paid. Permanent.
 *   resv:{cell}   sorted set, member = payment reference, score = expiry epoch.
 *                 A reservation holds pits while the payer is on the bank's
 *                 page. Without an expiry an abandoned checkout would lock
 *                 those pits for ever.
 *   ref:{ref}     "cell:qty", so a callback can find what a reference reserved.
 */

const RESERVE_SECONDS = 1800;   /* 30 minutes — the provider's token lifetime */

function cfg() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return url && token ? { url: url.replace(/\/+$/, ""), token: token } : null;
}

function configured() { return cfg() !== null; }

/* Upstash takes a command as a JSON array. Errors are swallowed and reported as
 * null: a ledger fault must never take down a payment. */
async function cmd(args) {
    const c = cfg();
    if (!c) return null;
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch(c.url, {
            method: "POST",
            headers: { Authorization: "Bearer " + c.token, "Content-Type": "application/json" },
            body: JSON.stringify(args),
            signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!r.ok) { console.error("ledger command failed:", r.status, args[0]); return null; }
        const j = await r.json();
        return j && Object.prototype.hasOwnProperty.call(j, "result") ? j.result : null;
    } catch (e) {
        console.error("ledger unreachable:", args[0], e && e.message);
        return null;
    }
}

function now() { return Math.floor(Date.now() / 1000); }

/* Confirmed sales plus reservations that have not expired. */
async function takenIn(cell) {
    if (!configured()) return null;
    await cmd(["ZREMRANGEBYSCORE", "resv:" + cell, "-inf", String(now())]);
    const sold = await cmd(["GET", "sold:" + cell]);
    const held = await cmd(["ZCOUNT", "resv:" + cell, String(now()), "+inf"]);
    return { sold: Number(sold) || 0, held: Number(held) || 0 };
}

/* Optimistic: add the reservation, then count. If that put the cell over
 * capacity, take it straight back out and refuse. Two people clicking together
 * cannot both succeed, because whoever counts second sees the other's entry —
 * a check followed by a write would let both through. */
async function reserve(cell, qty, ref, capacity) {
    if (!configured()) return { ok: true, ledger: false };

    const expiry = now() + RESERVE_SECONDS;
    /* Each pit is its own member so ZCOUNT counts pits, not reservations. */
    const args = ["ZADD", "resv:" + cell];
    for (let i = 0; i < qty; i++) args.push(String(expiry), ref + "#" + i);
    await cmd(args);

    const t = await takenIn(cell);
    if (t && t.sold + t.held > capacity) {
        await cmd(["ZREM", "resv:" + cell].concat(
            Array.from({ length: qty }, (_, i) => ref + "#" + i)));
        const left = Math.max(0, capacity - t.sold - (t.held - qty));
        return { ok: false, ledger: true, remaining: left };
    }

    await cmd(["SET", "ref:" + ref, cell + ":" + qty, "EX", String(RESERVE_SECONDS * 2)]);
    return { ok: true, ledger: true };
}

/* Payment succeeded: the reservation becomes a permanent sale. */
async function confirm(ref) {
    if (!configured()) return false;
    const raw = await cmd(["GET", "ref:" + ref]);
    if (!raw) { console.warn("ledger: no reservation for", ref); return false; }
    const i = String(raw).lastIndexOf(":");
    const cell = String(raw).slice(0, i), qty = Number(String(raw).slice(i + 1)) || 0;
    if (!cell || !qty) return false;

    await cmd(["INCRBY", "sold:" + cell, String(qty)]);
    await cmd(["ZREM", "resv:" + cell].concat(
        Array.from({ length: qty }, (_, k) => ref + "#" + k)));
    await cmd(["DEL", "ref:" + ref]);
    console.log("ledger: confirmed", qty, "pits in", cell, "for", ref);
    return true;
}

/* Payment failed or was cancelled: give the pits back at once rather than
 * waiting for the reservation to expire. */
async function release(ref) {
    if (!configured()) return false;
    const raw = await cmd(["GET", "ref:" + ref]);
    if (!raw) return false;
    const i = String(raw).lastIndexOf(":");
    const cell = String(raw).slice(0, i), qty = Number(String(raw).slice(i + 1)) || 0;
    if (cell && qty) {
        await cmd(["ZREM", "resv:" + cell].concat(
            Array.from({ length: qty }, (_, k) => ref + "#" + k)));
    }
    await cmd(["DEL", "ref:" + ref]);
    return true;
}

/* ── Захиалгын бүртгэл ───────────────────────────────────────────────────────
 * Google Sheet холбогдох хүртэл захиалга хаана ч бүртгэгдэхгүй байсан. Sheet нь
 * Apps Script deploy шаарддаг бөгөөд тэр нь удаж байгаа тул захиалгын бүрэн
 * бичлэгийг мөн энд хадгална. Сан аль хэдийн байгаа, нэмэлт тохиргоо шаардахгүй.
 *
 *   order:{ref}  захиалгын JSON
 *   orders       лавлагааны жагсаалт, шинэ нь тэргүүнд
 *
 * Sheet холбогдоход хоёулаа зэрэг ажиллана — нэг нь нөгөөгөө орлохгүй, аль нэг
 * нь унасан ч бичлэг үлдэнэ.
 */
async function saveOrder(o) {
    if (!configured()) return false;
    const rec = JSON.stringify({
        reference: o.reference, name: o.name, email: o.email,
        cell: o.cell || "", pits: o.pits, seedlings: o.pits * 3,
        amount: o.amount, currency: o.currency,
        status: "pending", created: new Date().toISOString(),
    });
    await cmd(["SET", "order:" + o.reference, rec]);
    /* Жагсаалтад нэг л удаа орно: давтагдсан хүсэлт мөрийг хоёр дахин
       нэмэхгүй байхын тулд эхлээд байгаа эсэхийг шалгана. */
    await cmd(["LREM", "orders", "0", o.reference]);
    await cmd(["LPUSH", "orders", o.reference]);
    return true;
}

async function markOrder(reference, status, txnId, method) {
    if (!configured()) return false;
    const raw = await cmd(["GET", "order:" + reference]);
    if (!raw) return false;
    let rec;
    try { rec = JSON.parse(raw); } catch (e) { return false; }
    rec.status = status;
    if (txnId) rec.txnId = txnId;
    if (method) rec.method = method;
    if (status === "paid") rec.paidAt = new Date().toISOString();
    await cmd(["SET", "order:" + reference, JSON.stringify(rec)]);
    return true;
}

/* One order, by reference. Lets the thank-you page name what was bought —
 * "3 pits in F-01" reads as a receipt where a reference number alone reads as
 * an error code. */
async function readOrder(reference) {
    if (!configured()) return null;
    const raw = await cmd(["GET", "order:" + reference]);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}

/* Claims a one-off action, so two racing callers cannot both perform it.
 *
 * SET NX either sets the key or does not, in one step, and only one caller can
 * be the one that set it. Used to keep a payment that arrives down both the
 * callback and the browser-return path from being announced twice.
 *
 * Without a ledger there is nowhere to record the claim, so it grants — a
 * duplicate notification is a far smaller harm than a silent one. */
async function claimOnce(key, seconds) {
    if (!configured()) return true;
    const r = await cmd(["SET", key, "1", "NX", "EX", String(seconds || 86400)]);
    return r !== null && r !== undefined;
}

async function listOrders(limit) {
    if (!configured()) return null;
    const refs = await cmd(["LRANGE", "orders", "0", String((limit || 500) - 1)]);
    if (!Array.isArray(refs) || !refs.length) return [];
    const rows = await Promise.all(refs.map(async (r) => {
        const raw = await cmd(["GET", "order:" + r]);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }));
    return rows.filter(Boolean);
}

module.exports = { configured, takenIn, reserve, confirm, release, RESERVE_SECONDS,
                   saveOrder, markOrder, listOrders, claimOnce, readOrder };
