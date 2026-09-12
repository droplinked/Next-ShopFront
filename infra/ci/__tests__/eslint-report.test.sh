#!/usr/bin/env bash
# Proves infra/ci/eslint-report.mjs can actually FAIL — on synthetic trees
# where ESLint is dead or matches too little — and that it PASSES the real
# repo in the SAME run, WITHOUT failing on the 10 errors it finds there.
# Next-ShopFront#287.
#
# ---------------------------------------------------------------------------
# WHY BOTH DIRECTIONS, IN ONE RUN
# ---------------------------------------------------------------------------
# A control that has only been seen passing is indistinguishable from one that
# cannot fail. That is not an abstraction here: it is precisely what #287
# found. `npm run lint` had been exiting 1 having linted zero files, no
# workflow invoked it, and `next build` printed the crash as a warning and
# exited 0. Every signal in the repository said healthy.
#
# So this suite asserts THREE distinct things, and the third is the one that
# is easy to lose:
#   1. the reporter FAILS when ESLint cannot run          (deny)
#   2. the reporter FAILS when ESLint matches too little  (deny, the floor)
#   3. the reporter PASSES when ESLint finds real errors  (report-only)
#
# Drop 3 and someone "tightens" this into a gate by accident, against an
# untriaged backlog, and the whole repo goes red. Drop 1 or 2 and the repo
# goes back to being silently unlinted.
#
# Usage:  bash infra/ci/__tests__/eslint-report.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
REPORTER="${REPO_ROOT}/infra/ci/eslint-report.mjs"
BASELINE="${REPO_ROOT}/infra/ci/eslint-baseline.json"
CONFIG="${REPO_ROOT}/eslint.config.mjs"
NEXT_CONFIG="${REPO_ROOT}/next.config.mjs"
WORKFLOW="${REPO_ROOT}/.github/workflows/pre-merge-checks.yml"
PKG="${REPO_ROOT}/package.json"

# Raise this when you add an assertion. Lower it only alongside a deliberately
# retired one, in the same PR. It is what stops this file from silently
# becoming a suite that asserts nothing while still printing PASSED.
MIN_ASSERTIONS=20

PASS=0
FAIL=0
ok()  { printf '  ok   %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf '  FAIL %s\n' "$1"; FAIL=$((FAIL + 1)); }

for f in "$REPORTER" "$BASELINE" "$CONFIG" "$NEXT_CONFIG" "$WORKFLOW" "$PKG"; do
  if [ ! -f "$f" ]; then
    echo "::error::${f} not found — the control this suite exists to prove has been moved or deleted."
    exit 1
  fi
done

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ---------------------------------------------------------------------------
# Fixtures. Each is a tiny tree with its OWN flat config, linked to the repo's
# node_modules so `import('eslint')` resolves without a second install.
# ---------------------------------------------------------------------------
mk_fixture() {
  local dir="$1"
  mkdir -p "$dir"
  ln -s "${REPO_ROOT}/node_modules" "${dir}/node_modules" 2>/dev/null || true
  printf '{"name":"fixture","version":"0.0.0","type":"module"}\n' >"${dir}/package.json"
}

# (1) a tree with exactly one real error
GOOD="${TMP}/one-error"; mk_fixture "$GOOD"
cat >"${GOOD}/eslint.config.mjs" <<'EOF'
export default [{ files: ['**/*.js'], rules: { 'no-undef': 'error' }, languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } }];
EOF
printf 'thisIsNotDefined();\n' >"${GOOD}/a.js"

# (2) a tree whose config THROWS on load — the #287 state, generalised
DEAD="${TMP}/dead-config"; mk_fixture "$DEAD"
cat >"${DEAD}/eslint.config.mjs" <<'EOF'
throw new Error('config is unloadable — this is the state dev was in before #287');
EOF
printf 'const x = 1;\n' >"${DEAD}/a.js"

# (3) a tree that lints CLEAN — used to prove the floor, not the findings
EMPTY="${TMP}/one-clean"; mk_fixture "$EMPTY"
cat >"${EMPTY}/eslint.config.mjs" <<'EOF'
export default [{ files: ['**/*.js'], rules: {}, languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } }];
EOF
printf 'export const x = 1;\n' >"${EMPTY}/a.js"

run() { # run <cwd> <floor>  -> sets OUT / RC
  OUT="$(node "$REPORTER" --cwd "$1" --floor "$2" 2>&1)"; RC=$?
}

echo "── deny: ESLint cannot run ────────────────────────────────────────────"
run "$DEAD" 1
[ "$RC" -ne 0 ] && ok "unloadable config -> exit ${RC} (non-zero)" || bad "unloadable config exited 0 — an UNLINTED repo would report healthy"
printf '%s' "$OUT" | grep -q 'ESLint could not run' \
  && ok "the message names the real condition (\"ESLint could not run\"), not a lint finding" \
  || bad "the failure message does not distinguish a dead linter from a lint finding"
printf '%s' "$OUT" | grep -q 'UNLINTED' \
  && ok "the message says the repository is UNLINTED" \
  || bad "the message does not say the repository is unlinted"

echo "── deny: the file floor ───────────────────────────────────────────────"
run "$GOOD" 999999
[ "$RC" -ne 0 ] && ok "floor 999999 over a 2-file tree -> exit ${RC} (non-zero)" || bad "the floor did not fire — a linter matching nothing would pass"
printf '%s' "$OUT" | grep -q 'below the floor' \
  && ok "the floor message names the floor" \
  || bad "the floor message does not name the floor"
# MUTATION: the SAME tree, the SAME reporter, a satisfiable floor -> passes.
# Without this the red above could be a broken reporter rather than the floor.
run "$GOOD" 1
[ "$RC" -eq 0 ] && ok "same tree, floor 1 -> exit 0 (the red above was the floor, not an outage)" || bad "the reporter cannot pass anything — exit ${RC}"

echo "── deny: a floor of zero is refused ───────────────────────────────────"
run "$GOOD" 0
[ "$RC" -ne 0 ] && ok "--floor 0 -> exit ${RC}; a floor of 0 is not a floor" || bad "--floor 0 was accepted, which disables the only hard assertion"

echo "── report-only: real errors do NOT fail ───────────────────────────────"
run "$GOOD" 1
[ "$RC" -eq 0 ] && ok "a tree with a real no-undef error -> exit 0 (REPORT-ONLY)" || bad "findings failed the run — this is a gate, and #287 says it must not be one yet"
printf '%s' "$OUT" | grep -qE '1 error\(s\)' \
  && ok "it reports \"1 error(s)\" — the count is measured, not hardcoded" \
  || bad "the reported error count is not 1 on a tree with exactly one error"
printf '%s' "$OUT" | grep -q 'no-undef' \
  && ok "the per-rule breakdown names no-undef" \
  || bad "the per-rule breakdown is missing"
# MUTATION: same reporter, same floor, a tree with ZERO errors -> still 0, and
# the count must CHANGE. A reporter that prints the same number either way is
# not reading the results.
run "$EMPTY" 1
printf '%s' "$OUT" | grep -qE '0 error\(s\)' \
  && ok "a clean tree reports \"0 error(s)\" — the count tracks the tree" \
  || bad "the count did not change between a dirty and a clean tree"

echo "── the real repository ────────────────────────────────────────────────"
OUT="$(cd "$REPO_ROOT" && node "$REPORTER" 2>&1)"; RC=$?
[ "$RC" -eq 0 ] && ok "the real repo -> exit 0 with its findings reported" || bad "the real repo failed (exit ${RC}) — report-only is not holding"
SCANNED="$(printf '%s' "$OUT" | sed -n 's/.*scanned \([0-9]*\) file(s).*/\1/p' | head -1)"
if [ -n "$SCANNED" ] && [ "$SCANNED" -ge 250 ]; then
  ok "the real repo scanned ${SCANNED} files (>= 250) — ESLint is genuinely reading the app"
else
  bad "the real repo scanned '${SCANNED}' files — ESLint is not reading the app"
fi

echo "── the config migration itself ────────────────────────────────────────"
[ ! -f "${REPO_ROOT}/.eslintrc.json" ] \
  && ok ".eslintrc.json is gone (eslint 10 rejects eslintrc outright)" \
  || bad ".eslintrc.json still exists — eslint 10 will refuse to start"
# 🚨 Next 16 REMOVES `next lint`. #265 would land that. A lint script calling
# it is a control with a scheduled death date.
if grep -qE '"lint"[[:space:]]*:[[:space:]]*"[^"]*next lint' "$PKG"; then
  bad "package.json lint still calls \`next lint\`, which Next 16 removes (#265)"
else
  ok "package.json lint does not call \`next lint\` (Next 16 removes it)"
fi
grep -qE '"lint"[[:space:]]*:' "$PKG" \
  && ok "package.json still has a lint script" \
  || bad "package.json has no lint script at all"

# 🚨 One owner, one severity policy. Without `ignoreDuringBuilds`, giving the
# build a loadable config turns `next build` into a HARD lint gate over the
# untriaged backlog — reddening the deploy as a side effect. Measured: with
# the flag removed, `npm run build` exits 1 on the 9 react-hooks errors; with
# it, exit 0 and zero eslint output.
if grep -qE 'eslint:[[:space:]]*\{[^}]*ignoreDuringBuilds:[[:space:]]*true' "$NEXT_CONFIG"; then
  ok "next.config.mjs keeps eslint.ignoreDuringBuilds — lint has ONE owner, the report step"
else
  bad "next.config.mjs no longer sets eslint.ignoreDuringBuilds:true — \`next build\` is now a hard lint gate over an untriaged backlog"
fi

echo "── the workflow actually runs it ──────────────────────────────────────"
GATE_LINE="$(grep -nE '^        run: node infra/ci/eslint-report\.mjs$' "$WORKFLOW" | head -1)"
if [ -n "$GATE_LINE" ]; then
  ok "next-build runs \`node infra/ci/eslint-report.mjs\` (anchored)"
  LINE_NO="${GATE_LINE%%:*}"
  # 🚨 The step must NOT be soft-failed. Its failure mode is "the linter is
  # dead", and a continue-on-error there recreates #287 exactly: a lint step
  # that is wired, reports success, and lints nothing.
  WINDOW="$(sed -n "$((LINE_NO > 8 ? LINE_NO - 8 : 1)),${LINE_NO}p" "$WORKFLOW" | grep -vE '^\s*#')"
  if printf '%s\n' "$WINDOW" | grep -qE 'continue-on-error|^\s+if:'; then
    bad "the eslint-report step is soft-failed — a dead linter would report success, which IS #287"
  else
    ok "the eslint-report step has no continue-on-error and no if:"
  fi
  INSTALL_LINE="$(grep -nE '^        run: npm ci --legacy-peer-deps --no-audit --no-fund$' "$WORKFLOW" | head -1)"
  if [ -n "$INSTALL_LINE" ] && [ "${INSTALL_LINE%%:*}" -lt "$LINE_NO" ]; then
    ok "it runs AFTER the install (line ${INSTALL_LINE%%:*} < ${LINE_NO})"
  else
    bad "it does not run after \`npm ci\` — eslint would not be installed"
  fi
else
  bad "no workflow step runs infra/ci/eslint-report.mjs — the reporter is decorative, which is the #287 defect again"
fi
grep -qE 'bash infra/ci/__tests__/eslint-report\.test\.sh' "$WORKFLOW" \
  && ok "this suite itself runs in the workflow" \
  || bad "this suite does not run in CI — it proves nothing about any real run"

echo
echo "----"
echo "passed: ${PASS}"
echo "failed: ${FAIL}"

if [ "$PASS" -lt "$MIN_ASSERTIONS" ]; then
  echo "::error::eslint-report.test.sh made only ${PASS} assertions, below its floor of ${MIN_ASSERTIONS}. A suite that quietly stops asserting still prints PASSED — that is the exact failure #287 is about. Raise MIN_ASSERTIONS when you add an assertion; lower it only alongside a deliberately retired one."
  exit 1
fi
if [ "$FAIL" -ne 0 ]; then
  echo "::error::eslint-report.test.sh failed (${FAIL} assertion(s)). Do NOT merge: either the reporter stopped denying, or the workflow stopped running it (Next-ShopFront#287)."
  exit 1
fi
echo "eslint-report.test.sh PASSED (${PASS} assertions)"
