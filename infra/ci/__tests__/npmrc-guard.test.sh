#!/usr/bin/env bash
# Proves infra/ci/npmrc-guard.mjs can actually FAIL — on synthetic npmrc files
# carrying resolution-affecting settings — and that it PASSES this repo's real
# .npmrc in the SAME run. Next-ShopFront#294.
#
# ---------------------------------------------------------------------------
# WHY THIS GUARD IS WORTH PROVING
# ---------------------------------------------------------------------------
# The thing it prevents is a ONE-LINE change that every other gate in this
# repository reports as healthy. Measured on dev @ 21956bf: with
# `legacy-peer-deps=true` in .npmrc, a clean regeneration yields 839 packages
# and 8 unmet peer edges instead of 890 and 3, dropping 70 lockfile entries
# including two first-party peers — and `next build` exits 0, `npm test`
# passes 67/0, and `tsc` is clean on that tree. Only the peer-conflict ratchet
# notices, and only after someone has already regenerated the lockfile.
#
# A guard against that must be shown to deny, or it is decoration.
#
# Usage:  bash infra/ci/__tests__/npmrc-guard.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
GUARD="${REPO_ROOT}/infra/ci/npmrc-guard.mjs"
NPMRC="${REPO_ROOT}/.npmrc"
WORKFLOW="${REPO_ROOT}/.github/workflows/pre-merge-checks.yml"
MAINT="${REPO_ROOT}/.github/workflows/lockfile-maintenance.yml"

# Raise when you add an assertion; lower only alongside a retired one.
MIN_ASSERTIONS=18

PASS=0; FAIL=0
ok()  { printf '  ok   %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf '  FAIL %s\n' "$1"; FAIL=$((FAIL + 1)); }

for f in "$GUARD" "$NPMRC" "$WORKFLOW" "$MAINT"; do
  [ -f "$f" ] || { echo "::error::${f} not found — the control this suite exists to prove has been moved or deleted."; exit 1; }
done

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
run() { OUT="$(node "$GUARD" --npmrc "$1" 2>&1)"; RC=$?; }

echo "── deny: the setting this guard exists for ───────────────────────────"
printf 'registry=https://registry.npmjs.org/\nlegacy-peer-deps=true\n' >"${TMP}/lpd"
run "${TMP}/lpd"
[ "$RC" -ne 0 ] && ok "legacy-peer-deps=true -> exit ${RC}" || bad "legacy-peer-deps=true was accepted — 839 vs 890 packages would ship unnoticed"
printf '%s' "$OUT" | grep -q 'legacy-peer-deps' && ok "the message names the offending key" || bad "the message does not name the key"
printf '%s' "$OUT" | grep -q 'lockfile-maintenance' && ok "the message names what else the key would break" || bad "the message does not say what the key breaks"

echo "── deny: the other resolution-affecting keys ─────────────────────────"
for k in strict-peer-deps force package-lock install-strategy omit; do
  printf 'registry=https://registry.npmjs.org/\n%s=whatever\n' "$k" >"${TMP}/k"
  run "${TMP}/k"
  [ "$RC" -ne 0 ] && ok "${k} -> exit ${RC}" || bad "${k} was accepted"
done

echo "── deny: a missing file is not a pass ────────────────────────────────"
run "${TMP}/does-not-exist"
[ "$RC" -ne 0 ] && ok "absent .npmrc -> exit ${RC} (a guard that reads nothing passes everything)" || bad "an absent .npmrc was treated as clean"

echo "── deny: the parse floor ─────────────────────────────────────────────"
printf '# only comments here\n; and this\n' >"${TMP}/empty"
run "${TMP}/empty"
[ "$RC" -ne 0 ] && ok "a settings-free npmrc -> exit ${RC} (the parser is asserted to be reading something)" || bad "zero parsed settings passed — the parser could break silently"

echo "── clean: benign keys, and comments, are NOT flagged ─────────────────"
# MUTATION of the deny cases above: same guard, same shape of file, keys that
# cannot change the installed tree. If this reds, the guard is a blanket ban
# rather than a screen, and the denials above prove nothing.
printf 'registry=https://registry.npmjs.org/\nsave-exact=false\naudit-level=high\n' >"${TMP}/benign"
run "${TMP}/benign"
[ "$RC" -eq 0 ] && ok "registry/save-exact/audit-level -> exit 0 (the guard is selective, not a blanket ban)" || bad "benign keys were rejected — exit ${RC}"
printf '; legacy-peer-deps=true is deliberately absent\n#legacy-peer-deps=true\nregistry=https://registry.npmjs.org/\n' >"${TMP}/commented"
run "${TMP}/commented"
[ "$RC" -eq 0 ] && ok "a COMMENTED legacy-peer-deps line -> exit 0 (the record may discuss the key it forbids)" || bad "the guard flagged a comment — the decision record could not document itself"

echo "── the real repository ───────────────────────────────────────────────"
OUT="$(node "$GUARD" 2>&1)"; RC=$?
[ "$RC" -eq 0 ] && ok "this repo's .npmrc -> exit 0" || bad "this repo's .npmrc failed its own guard (exit ${RC})"
printf '%s' "$OUT" | grep -qE '3 setting\(s\)' && ok "it parsed 3 settings — the real file is being read, not skipped" || bad "the real .npmrc did not parse to 3 settings"
grep -qE '^legacy-peer-deps' "$NPMRC" && bad ".npmrc sets legacy-peer-deps — see infra/ci/npmrc-guard.mjs" || ok ".npmrc does not set legacy-peer-deps (uncommented)"

echo "── the decision is recorded where it will be read ────────────────────"
grep -q 'legacy-peer-deps' "$NPMRC" \
  && ok ".npmrc itself carries the decision, so the next person to consider the line reads why not" \
  || bad ".npmrc does not mention legacy-peer-deps at all — the decision lives nowhere near the file it is about"
# 🚨 lockfile-maintenance.yml keeps its refresh steps BARE on purpose. The
# npmrc key would override them invisibly; assert they are still bare, so the
# thing the guard protects has not quietly changed underneath it.
if grep -qE '^        run: npm (update|install) --package-lock-only$' "$MAINT"; then
  ok "lockfile-maintenance refresh steps are still bare (the guard protects a live decision)"
else
  bad "lockfile-maintenance's refresh steps are no longer bare --package-lock-only"
fi
grep -qE '^        run: npm ci --dry-run$' "$MAINT" \
  && ok "lockfile-maintenance still verifies with a STRICT npm ci --dry-run" \
  || bad "the strict dry-run verification is gone — the flag's damage would be unobservable"

# 🚨 `npm ci --dry-run` proves the refreshed lockfile INSTALLS. It cannot
# prove the lockfile still CONTAINS what it should — a tree that quietly lost
# 51 peer entries installs perfectly. The ratchet after the refresh is the
# assertion that a regeneration did not lose peer entries (#294), and it must
# run AFTER a real install because it reads the installed tree, not the file.
RATCHET_LINE="$(grep -nE '^          node infra/ci/peer-conflict-ratchet\.mjs$' "$MAINT" | head -1)"
if [ -n "$RATCHET_LINE" ]; then
  ok "lockfile-maintenance runs the peer-conflict ratchet after the refresh"
  MAINT_INSTALL="$(grep -nE '^          npm ci --legacy-peer-deps --no-audit --no-fund$' "$MAINT" | head -1)"
  if [ -n "$MAINT_INSTALL" ] && [ "${MAINT_INSTALL%%:*}" -lt "${RATCHET_LINE%%:*}" ]; then
    ok "it installs for real BEFORE the ratchet (line ${MAINT_INSTALL%%:*} < ${RATCHET_LINE%%:*})"
  else
    bad "the ratchet in lockfile-maintenance does not run after a real install — it would scan an empty tree"
  fi
else
  bad "lockfile-maintenance does not run the ratchet after refreshing — a refresh that drops peer entries still opens a PR"
fi

echo "── the workflow actually runs the guard ──────────────────────────────"
if grep -qE '^        run: node infra/ci/npmrc-guard\.mjs$' "$WORKFLOW"; then
  ok "pre-merge-checks runs \`node infra/ci/npmrc-guard.mjs\` (anchored)"
else
  bad "no workflow step runs the guard — it is decoration"
fi
grep -qE 'bash infra/ci/__tests__/npmrc-guard\.test\.sh' "$WORKFLOW" \
  && ok "this suite itself runs in the workflow" \
  || bad "this suite does not run in CI"

echo; echo "----"; echo "passed: ${PASS}"; echo "failed: ${FAIL}"
if [ "$PASS" -lt "$MIN_ASSERTIONS" ]; then
  echo "::error::npmrc-guard.test.sh made only ${PASS} assertions, below its floor of ${MIN_ASSERTIONS}. A suite that quietly stops asserting still prints PASSED."
  exit 1
fi
if [ "$FAIL" -ne 0 ]; then
  echo "::error::npmrc-guard.test.sh failed (${FAIL} assertion(s)). Do NOT merge (Next-ShopFront#294)."
  exit 1
fi
echo "npmrc-guard.test.sh PASSED (${PASS} assertions)"
