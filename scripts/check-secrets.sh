#!/bin/sh
# Proves no payment credential can reach the public site.
#
# Run before every deploy:  sh scripts/check-secrets.sh
#
# Three separate things are checked, because "it isn't in the HTML" is not the
# same as "it isn't in the repository" and neither is the same as "it was never
# committed". A secret removed in the latest commit still sits in git history
# and is still compromised.

set -e
cd "$(dirname "$0")/.."
fail=0

say() { printf '%s\n' "$1"; }
ok()  { printf '  PASS  %s\n' "$1"; }
bad() { printf '  FAIL  %s\n' "$1"; fail=1; }

say ""
say "1 · No credential is read anywhere the browser can see"
# api/ runs on the server. Everything else ships to the visitor.
leak=$(grep -rl "MINU_" --include="*.html" --include="*.css" . 2>/dev/null \
        | grep -v node_modules || true)
leak="$leak$(grep -rl 'MINU_' --include='*.js' . 2>/dev/null | grep -v node_modules | grep -v '^\./api/' || true)"
if [ -n "$(printf '%s' "$leak" | tr -d '[:space:]')" ]; then
    bad "a client-side file mentions MINU_:"; printf '%s\n' "$leak"
else
    ok "MINU_* appears only inside api/, which never ships to the browser"
fi

say ""
say "2 · No real value is committed"
if [ -f .env ] && git ls-files --error-unmatch .env >/dev/null 2>&1; then
    bad ".env is TRACKED by git — it must be ignored"
else
    ok ".env is not tracked"
fi
# .env.example must carry names only: every line is either a comment or KEY=
if [ -f .env.example ]; then
    # CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL carry public addresses, not secrets.
    filled=$(grep -E '^[A-Z_]+=.+' .env.example | grep -vE '^CONTACT_(TO|FROM)_EMAIL=' || true)
    if [ -n "$filled" ]; then
        bad ".env.example has values in it, not just names:"; printf '%s\n' "$filled"
    else
        ok ".env.example lists names with no values"
    fi
fi

say ""
say "3 · The integration document is not committable"
for doc in ECOMMERCE_CLIENT_v6\ 2.pdf; do
    [ -e "$doc" ] || continue
    if git check-ignore -q "$doc"; then ok "$doc is gitignored"; else bad "$doc is NOT ignored — it would deploy publicly"; fi
done
if git ls-files | grep -qiE '\.pdf$'; then bad "a PDF is tracked by git"; else ok "no PDF is tracked"; fi

say ""
say "4 · Nothing secret-shaped anywhere in the tracked tree"
# Scoped to code. The provider's URLs are published in their own document and
# are not secret; what matters is that code reads MINU_BASE_URL instead of
# baking one in, so .env.example's comments are not a finding.
hits=$(git grep -nIE "(api\.minu\.mn/oncom[^-]|MINU_PASSWORD[[:space:]]*=[[:space:]]*[^[:space:]]|Bearer [A-Za-z0-9._-]{20,})" \
        -- '*.js' '*.html' ':!node_modules' ':!scripts/check-secrets.sh' 2>/dev/null || true)
if [ -n "$hits" ]; then
    bad "possible secret or hardcoded production endpoint:"; printf '%s\n' "$hits"
else
    ok "no hardcoded credentials or production endpoint in tracked files"
fi

say ""
say "5 · Git history has never contained a real value"
# -G takes a regex over the diff, so this matches a NAME WITH A VALUE after it.
# Plain -S"MINU_PASSWORD=" would match .env.example, where the empty name is
# exactly what belongs there. The checker's own source is excluded: its search
# patterns are permanently in history and would flag forever.
for rx in "MINU_PASSWORD=[^[:space:]\"']" "MINU_USERNAME=[^[:space:]\"']" "MINU_MERCHANT_CODE=[^[:space:]\"']" "K/Uit""4"; do
    found=$(git log --all -G"$rx" --oneline -- . ':!scripts/check-secrets.sh' 2>/dev/null | head -3 || true)
    if [ -n "$found" ]; then
        bad "a real value for '$rx' is in history — ROTATE that credential now:"; printf '%s\n' "$found"
    else
        ok "no commit has ever carried a value for ${rx%%=*}"
    fi
done

say ""
if [ "$fail" -eq 0 ]; then
    say "All checks passed — safe to deploy."
else
    say "FAILED — do not deploy until the above is resolved."
fi
exit $fail
