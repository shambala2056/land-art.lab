/* Stand-ins for the two things a laptop does not have: the bank and the ledger.
 *
 * The point is NOT to fake the checkout. It is to let the real checkout run.
 * api/*.js is untouched and unaware: pay-create really creates an invoice,
 * _ledger really reserves pits over the Upstash REST protocol, _settle really
 * verifies the transaction with the provider before believing it, and tree
 * numbers really come out of an INCRBY. Only the far ends are local — an
 * in-memory Redis and a payment provider that answers on localhost.
 *
 * Nothing here is deployed. It is required by scripts/dev-server.js only, and
 * only when the server is started with DEMO=1.
 *
 *   DEMO=1 node scripts/dev-server.js
 *
 * State lives in this process and dies with it, which is the right lifetime for
 * a demo: restart the server and the site is unsold again.
 */

"use strict";

/* ── an in-memory Redis, speaking Upstash's REST dialect ──────────────────────
 * Upstash takes ["SET","k","v","EX","60"] as JSON and answers {result: …}.
 * Implemented here for exactly the commands api/_ledger.js issues, and no more:
 * a fuller fake would be more code and less obviously correct.
 */
const store = new Map();       /* key -> {v, exp}  — strings and lists */
const zsets = new Map();       /* key -> Map(member -> score) */

function now() { return Math.floor(Date.now() / 1000); }

function live(key) {
    const e = store.get(key);
    if (!e) return null;
    if (e.exp && e.exp <= now()) { store.delete(key); return null; }
    return e;
}

function redis(args) {
    const cmd = String(args[0] || "").toUpperCase();
    const key = args[1];

    switch (cmd) {
        case "SET": {
            const opts = args.slice(3).map(function (a) { return String(a).toUpperCase(); });
            if (opts.indexOf("NX") > -1 && live(key)) return null;      /* already claimed */
            let exp = 0;
            const ex = opts.indexOf("EX");
            if (ex > -1) exp = now() + Number(args[3 + ex + 1]);
            store.set(key, { v: String(args[2]), exp: exp });
            return "OK";
        }
        case "GET": {
            const e = live(key);
            return e && typeof e.v === "string" ? e.v : null;
        }
        case "DEL": {
            let n = 0;
            args.slice(1).forEach(function (k) {
                if (store.delete(k)) n++;
                if (zsets.delete(k)) n++;
            });
            return n;
        }
        case "INCRBY": {
            const e = live(key);
            const next = (Number(e && e.v) || 0) + Number(args[2]);
            store.set(key, { v: String(next), exp: e ? e.exp : 0 });
            return next;
        }
        case "LPUSH": {
            const e = live(key);
            const list = (e && Array.isArray(e.v)) ? e.v : [];
            args.slice(2).forEach(function (v) { list.unshift(String(v)); });
            store.set(key, { v: list, exp: 0 });
            return list.length;
        }
        case "LREM": {
            const e = live(key);
            if (!e || !Array.isArray(e.v)) return 0;
            const target = String(args[3]);
            const before = e.v.length;
            e.v = e.v.filter(function (x) { return x !== target; });
            return before - e.v.length;
        }
        case "LRANGE": {
            const e = live(key);
            if (!e || !Array.isArray(e.v)) return [];
            const start = Number(args[2]), stop = Number(args[3]);
            return e.v.slice(start, stop < 0 ? undefined : stop + 1);
        }
        case "ZADD": {
            const z = zsets.get(key) || new Map();
            for (let i = 2; i < args.length; i += 2) z.set(String(args[i + 1]), Number(args[i]));
            zsets.set(key, z);
            return z.size;
        }
        case "ZREM": {
            const z = zsets.get(key);
            if (!z) return 0;
            let n = 0;
            args.slice(2).forEach(function (m) { if (z.delete(String(m))) n++; });
            return n;
        }
        case "ZCOUNT": {
            const z = zsets.get(key);
            if (!z) return 0;
            const lo = args[2] === "-inf" ? -Infinity : Number(args[2]);
            const hi = args[3] === "+inf" ? Infinity : Number(args[3]);
            let n = 0;
            z.forEach(function (score) { if (score >= lo && score <= hi) n++; });
            return n;
        }
        case "ZREMRANGEBYSCORE": {
            const z = zsets.get(key);
            if (!z) return 0;
            const lo = args[2] === "-inf" ? -Infinity : Number(args[2]);
            const hi = args[3] === "+inf" ? Infinity : Number(args[3]);
            let n = 0;
            Array.from(z.entries()).forEach(function (pair) {
                if (pair[1] >= lo && pair[1] <= hi) { z.delete(pair[0]); n++; }
            });
            return n;
        }
        default:
            console.warn("dev-mock redis: unsupported command", cmd);
            return null;
    }
}

/* ── a stand-in payment provider ─────────────────────────────────────────────
 * Speaks the three calls api/_minu.js makes. Transactions live in a map keyed
 * by our own reference, so checkTxn can answer truthfully — which matters,
 * because _settle refuses to believe a payment the provider will not confirm,
 * and a mock that always said "paid" would never exercise that.
 */
const txns = new Map();        /* reference -> {status, txnId, type} */
const sheetCalls = [];         /* every write _sheet.js attempts, in order */
const mail = [];               /* letters the site tried to send, newest first */

function invoiceUrl(origin, ref) {
    return origin + "/__mock/bank?ref=" + encodeURIComponent(ref);
}

/* The invoice carries production addresses, because pay-create is right to put
 * canonical ones on it and must not be softened for a demo. The bank is what
 * knows it is standing in, so the rewrite belongs here. */
function toLocal(url, origin) {
    if (!url) return null;
    return String(url).replace(/^https?:\/\/(www\.)?land-art\.space/i, origin);
}

async function handle(pathname, req, res, body, origin) {
    /* --- ledger --- */
    if (pathname === "/__mock/redis") {
        const args = Array.isArray(body) ? body : [];
        let result;
        try { result = redis(args); }
        catch (e) { return res.status(500).json({ error: String(e.message) }); }
        return res.status(200).json({ result: result });
    }

    /* --- provider --- */
    if (pathname === "/__mock/oncom-test/login") {
        return res.status(200).json({ status: "000", entity: "demo-token" });
    }

    if (pathname === "/__mock/oncom-test/invoice") {
        const ref = body && body.referenceNumber;
        if (!ref) return res.status(400).json({ status: "001", message: "no reference" });
        txns.set(ref, {
            status: null, txnId: null, type: null,
            amount: body.amount, currency: body.currency,
            webhook: toLocal(body.webhook, origin),
            redirect: toLocal(body.redirectUtl, origin),
        });
        console.log("dev-mock: invoice for", ref, "amount", body.amount);
        return res.status(200).json({
            status: "000",
            entity: { invoice: invoiceUrl(origin, ref) },
        });
    }

    if (pathname.indexOf("/__mock/oncom-test/checkTxn/") === 0) {
        const parts = pathname.split("/");
        const ref = decodeURIComponent(parts[parts.length - 1] || "");
        const t = txns.get(ref);
        /* An unknown reference is "no verdict yet", not an error — the same
           thing the real provider says before anyone has paid. */
        return res.status(200).json({
            status: "000",
            entity: { status: t ? t.status : null, txnId: t ? t.txnId : null },
        });
    }

    /* --- the Google Sheet webhook ---
       Records what _sheet.js sends so a demo run can show whether the "status"
       call is made at all. The live sheet showing only "pending" says either
       that this call never happens or that the Apps Script ignores it, and
       those are very different faults. */
    if (pathname === "/__mock/sheet") {
        /* The whole payload, not a summary: this log is how a demo run proves
           what the sheet would actually receive, and a summary can only prove
           what it was written to look for. The secret is dropped. */
        const seen = Object.assign({}, body);
        delete seen.secret;
        sheetCalls.push(seen);
        console.log("dev-mock sheet:", body && body.action, body && body.reference,
                    body && body.status || "");
        return res.status(200).json({ ok: true });
    }
    if (pathname === "/__mock/sheet-log") {
        return res.status(200).json({ calls: sheetCalls });
    }

    /* --- the post box ---
       Real letters go through Resend to a real person. Here they stop at this
       address, so the whole flow — including the tree's letter and the numbers
       in it — can be run and read without mailing anybody. */
    if (pathname === "/__mock/mail") {
        mail.unshift(Object.assign({ at: new Date().toISOString() }, body || {}));
        console.log("dev-mock mail:", (body && body.to) || "?", "·",
                    (body && body.subject) || "");
        return res.status(200).json({ ok: true });
    }
    if (pathname === "/__mock/mail-log") {
        return res.status(200).json({ mail: mail });
    }
    if (pathname === "/__mock/inbox") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).end(inboxPage());
    }

    /* --- the bank's own page --- */
    if (pathname === "/__mock/bank") {
        const ref = (req.query && req.query.ref) || "";
        const t = txns.get(ref);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        if (!t) return res.status(404).end("<h1>Unknown reference</h1>");
        return res.status(200).end(bankPage(ref, t));
    }

    if (pathname === "/__mock/bank/pay") {
        const ref = (body && body.ref) || "";
        const outcome = (body && body.outcome) || "paid";
        const t = txns.get(ref);
        if (!t) return res.status(404).json({ error: "unknown reference" });

        /* Provider codes, as the integration document defines them. */
        t.status = outcome === "paid" ? "000" : outcome === "cancelled" ? "011" : "010";
        t.txnId = "DEMO" + Math.floor(Math.random() * 1e9);
        t.type = "card";

        /* Fire the webhook exactly as the provider would — server to server,
           before the browser gets anywhere. This is the path that settles the
           payment and hands out the tree numbers in production, so the demo
           had better exercise it rather than relying on the return.
           `silent` suppresses it, which is how a real payment ends up stuck as
           pending: the money moved, the provider knows, and our webhook never
           arrived. That is the case reconciliation has to be able to recover. */
        let hook = "skipped";
        if (t.webhook && !(body && body.silent)) {
            try {
                const r = await fetch(t.webhook, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: "000",
                        entity: { referenceNumber: ref, status: t.status,
                                  txnId: t.txnId, type: t.type },
                    }),
                });
                hook = r.status + " " + (await r.text()).slice(0, 80);
            } catch (e) { hook = "failed: " + e.message; }
        }
        console.log("dev-mock:", ref, "->", outcome, "· webhook", hook);
        return res.status(200).json({ ok: true, redirect: t.redirect, webhook: hook });
    }

    return false;      /* not ours */
}

function bankPage(ref, t) {
    const amount = (t.currency === "840" ? "$" : "₮") + Number(t.amount).toLocaleString("en-US");
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Demo payment page</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:#1D2430;color:#E9EDF3;font:16px/1.6 system-ui,sans-serif;padding:24px}
.card{background:#252E3C;border:1px solid #36404F;border-radius:20px;padding:34px;max-width:430px;width:100%}
.tag{display:inline-block;background:#3A2A12;color:#E0A93C;border-radius:100px;
  padding:5px 13px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
h1{font-size:22px;margin:16px 0 6px}
p{color:#A8B2C1;font-size:14px;margin:0 0 18px}
dl{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13.5px;margin:0 0 24px}
dt{color:#7F8B9C}dd{margin:0;text-align:right;font-family:ui-monospace,Menlo,monospace}
button{width:100%;border:0;border-radius:100px;padding:14px;font-size:14px;font-weight:700;
  cursor:pointer;margin-bottom:10px}
.pay{background:#4BAE4F;color:#fff}.cancel{background:#333D4B;color:#C7D0DC}
.out{font-size:12.5px;color:#7F8B9C;white-space:pre-wrap;margin-top:14px}
</style></head><body>
<div class="card">
  <span class="tag">Demo — not a real bank</span>
  <h1>Confirm payment</h1>
  <p>This page stands in for the 360 Finance hosted checkout so the flow can be
     walked through locally. No money moves.</p>
  <dl>
    <dt>Reference</dt><dd>${ref}</dd>
    <dt>Amount</dt><dd>${amount}</dd>
  </dl>
  <button class="pay" data-o="paid">Pay ${amount}</button>
  <button class="cancel" data-o="cancelled">Cancel the payment</button>
  <div class="out" id="out"></div>
</div>
<script>
document.querySelectorAll("button").forEach(function (b) {
  b.onclick = function () {
    document.getElementById("out").textContent = "Calling the webhook…";
    fetch("/__mock/bank/pay", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: ${JSON.stringify(ref)}, outcome: b.dataset.o }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        document.getElementById("out").textContent = "webhook: " + d.webhook;
        /* The provider appends its result to redirectUtl; pay-return absorbs
           whatever shape arrives, so the demo appends it the same way. */
        setTimeout(function () { location.href = d.redirect; }, 700);
      });
  };
});
</script></body></html>`;
}

/* The post box, as a page. Shows what actually left the building — who it went
 * to, what the subject line was, and the letter itself with the tree numbers in
 * it, so a test run can be checked by reading rather than by grepping a log. */
function inboxPage() {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Post box · demo</title>
<style>
  body{margin:0;background:#F2F0EA;color:#14150F;padding:28px 20px;
       font:400 15px/1.6 'Urbanist',system-ui,-apple-system,sans-serif}
  .wrap{max-width:720px;margin:0 auto}
  h1{font-size:20px;font-weight:700;margin:0 0 4px}
  .sub{color:#5E5F55;font-size:13px;margin:0 0 22px}
  .m{background:#FBFAF6;border:1px solid #E0DACA;border-radius:18px;
     padding:20px 22px;margin-bottom:14px}
  .to{font-size:12px;color:#5E5F55}
  .subj{font-weight:700;margin:3px 0 12px}
  .codes{display:inline-block;background:#B8E020;border-radius:100px;
         padding:3px 12px;font:700 11px/1.6 ui-monospace,Menlo,monospace;
         letter-spacing:.04em;margin-bottom:12px}
  pre{white-space:pre-wrap;margin:0;font:inherit;color:#2E2F27}
  .none{color:#5E5F55;font-style:italic}
</style></head><body><div class="wrap">
<h1>Post box</h1>
<p class="sub">Every letter the site tried to send. Nothing here left this laptop. Reloads on its own.</p>
<div id="list"><p class="none">Nothing yet — complete a payment and it appears here.</p></div>
</div><script>
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function draw(m){
  var el=document.getElementById('list');
  if(!m.length) return;
  el.innerHTML=m.map(function(x){
    return '<div class="m"><div class="to">'+esc(x.at)+' &middot; to '+esc(x.to)+
      '<br>from '+esc(x.from)+'</div>'+
      '<div class="subj">'+esc(x.subject)+'</div>'+
      (x.codes&&x.codes.length?'<div class="codes">'+esc(x.codes.join(' · '))+'</div>':'')+
      '<pre>'+esc(x.text)+'</pre></div>';
  }).join('');
}
function poll(){
  fetch('/__mock/mail-log').then(function(r){return r.json();})
    .then(function(d){draw((d&&d.mail)||[]);}).catch(function(){});
}
poll(); setInterval(poll,2000);
</script></body></html>`;
}

/* Environment the real code reads. Set before any api/ module is required, so
 * config() sees it on the first call. */
function env(origin) {
    const set = {
        /* The path carries "oncom-test" on purpose: pay-config reads the
           provider base to decide whether to tell the visitor no real card is
           charged, and in demo mode that is exactly true. */
        MINU_BASE_URL: origin + "/__mock/oncom-test",
        MINU_USERNAME: "demo",
        MINU_PASSWORD: "demo",
        MINU_MERCHANT_CODE: "DEMO001",
        MINU_WEBHOOK_KEY: "demo-webhook-key",
        KV_REST_API_URL: origin + "/__mock/redis",
        KV_REST_API_TOKEN: "demo",
        ORDERS_TOKEN: "demo-orders-token",
        SHEETS_WEBHOOK_URL: origin + "/__mock/sheet",
        SHEETS_WEBHOOK_SECRET: "demo-sheet-secret",
        /* Diverts the buyer's letter to /__mock/mail instead of Resend, and
           tells the letter which origin its certificate links live on.
           SEND_TREE_LETTER is deliberately not set here: the demo should match
           production, where the letter is currently switched off. Run the
           server as SEND_TREE_LETTER=1 to see the letter in the post box. */
        MAIL_SINK_URL: origin + "/__mock/mail",
        PUBLIC_BASE_URL: origin,
    };
    Object.keys(set).forEach(function (k) {
        if (process.env[k] === undefined) process.env[k] = set[k];
    });
    return set;
}

module.exports = { handle, env, redis };
