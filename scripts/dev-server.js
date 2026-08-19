/* Local development server.
 *
 * A plain file server cannot run the api/ functions, and the Vercel CLI is not
 * installed here. This serves the static site AND mounts api/*.js with the same
 * request/response shape Vercel gives them, so payment endpoints can be tried
 * locally before anything is deployed.
 *
 *   node scripts/dev-server.js            -> http://localhost:8787
 *
 * Reads .env if present, exactly as Vercel injects environment variables in
 * production. That file is gitignored; nothing here writes or prints a value.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || 8787;

/* Minimal .env reader — no dependency, and it must never echo what it loads. */
(function loadEnv() {
    const file = path.join(ROOT, ".env");
    if (!fs.existsSync(file)) return;
    let loaded = 0;
    fs.readFileSync(file, "utf8").split("\n").forEach(function (line) {
        const t = line.trim();
        if (!t || t.charAt(0) === "#") return;
        const i = t.indexOf("=");
        if (i < 1) return;
        const key = t.slice(0, i).trim();
        let val = t.slice(i + 1).trim();
        if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1);
        if (val === "") return;                       // an empty name is not "set"
        if (process.env[key] === undefined) { process.env[key] = val; loaded++; }
    });
    console.log("loaded " + loaded + " environment values from .env (names and values not shown)");
})();

/* Anything git ignores must be unreachable here too. On Vercel those files are
 * simply never deployed, so they 404 by accident of the pipeline; a local server
 * rooted at the project directory has no such luck and will happily hand over
 * the payment provider's PDF. Computed once at startup from git itself, so the
 * rule cannot drift from .gitignore. */
const IGNORED = (function () {
    try {
        const out = require("child_process")
            .execSync("git ls-files --others --ignored --exclude-standard -z", { cwd: ROOT })
            .toString("utf8");
        const set = new Set(out.split("\0").filter(Boolean).map(function (f) { return "/" + f; }));
        console.log("refusing to serve " + set.size + " gitignored files (never deployed either)");
        return set;
    } catch (e) {
        console.warn("could not ask git what is ignored — serving nothing but known types");
        return new Set();
    }
})();

const TYPES = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".json": "application/json",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4",
    ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
    ".ico": "image/x-icon", ".csv": "text/csv",
};

/* Gives the handler the res.status().json() interface Vercel provides. */
function shim(res) {
    res.status = function (code) { res.statusCode = code; return res; };
    res.json = function (obj) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(obj));
        return res;
    };
    res.send = function (body) { res.end(body); return res; };
    return res;
}

function readBody(req) {
    return new Promise(function (resolve) {
        let data = "";
        req.on("data", function (c) { data += c; if (data.length > 1e6) req.destroy(); });
        req.on("end", function () {
            if (!data) return resolve({});
            try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
        });
    });
}

const server = http.createServer(async function (req, res) {
    shim(res);
    const url = new URL(req.url, "http://localhost:" + PORT);
    let pathname = decodeURIComponent(url.pathname);

    /* api/ routes. Files starting with _ are helpers, not endpoints — the same
       rule Vercel applies, which is why api/_minu.js is not reachable. */
    if (pathname.indexOf("/api/") === 0) {
        const name = pathname.slice(5).replace(/\.js$/, "");
        if (!name || name.charAt(0) === "_" || !/^[a-z0-9-]+$/i.test(name)) {
            return res.status(404).json({ error: "Not found" });
        }
        const file = path.join(ROOT, "api", name + ".js");
        if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
        try {
            delete require.cache[require.resolve(file)];      // pick up edits without a restart
            const handler = require(file);
            req.body = await readBody(req);
            req.query = Object.fromEntries(url.searchParams);
            return await handler(req, res);
        } catch (err) {
            console.error("handler threw:", err && err.message);
            return res.status(500).json({ error: "Handler error" });
        }
    }

    /* Static files. Refuse dotfiles outright so a stray .env can never be read
       through this server the way it cannot be through Vercel. */
    if (pathname.split("/").some(function (p) { return p.charAt(0) === "."; })) {
        return res.status(404).send("Not found");
    }
    if (IGNORED.has(pathname)) {
        console.warn("refused (gitignored):", pathname);
        return res.status(404).send("Not found");
    }
    if (pathname === "/") pathname = "/index.html";
    const file = path.join(ROOT, pathname);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        return res.status(404).send("Not found");
    }
    res.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
});

server.listen(PORT, function () {
    console.log("site  http://localhost:" + PORT + "/");
    console.log("api   http://localhost:" + PORT + "/api/pay-create  (POST)");
});
