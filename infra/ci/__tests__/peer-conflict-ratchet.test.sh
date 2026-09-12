#!/usr/bin/env bash
# Proves infra/ci/peer-conflict-ratchet.mjs can actually FAIL — on a synthetic
# node_modules tree with a real, arborist-detected peer conflict — and that it
# PASSES the clean tree in the SAME run. Next-ShopFront#285.
#
# ---------------------------------------------------------------------------
# WHY BOTH DIRECTIONS, IN ONE RUN
# ---------------------------------------------------------------------------
# A gate that has only been seen passing is indistinguishable from one that
# cannot fail. A gate that has only been seen failing is indistinguishable from
# an outage. The denying case proves the screen exists; the clean case right
# next to it proves the screen is selective — that the red was the conflict
# and not a broken scanner. Neither case alone is evidence.
#
# ---------------------------------------------------------------------------
# NO node_modules REQUIRED
# ---------------------------------------------------------------------------
# The `changes` job runs this straight after checkout, before any install.
# Arborist is loaded from npm's own installation (`npm root -g`), so the
# fixtures are the only trees involved. Asserting the REAL tree is the job of
# the `peer-conflict ratchet` step in `verify`, after `npm ci`.
#
# Usage:  bash infra/ci/__tests__/peer-conflict-ratchet.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
RATCHET="${REPO_ROOT}/infra/ci/peer-conflict-ratchet.mjs"
BASELINE="${REPO_ROOT}/infra/ci/peer-conflict-baseline.json"
WORKFLOW="${REPO_ROOT}/.github/workflows/pre-merge-checks.yml"

PASS=0
FAIL=0
ok()  { printf '  ok   %s\n' "$1"; PASS=$((PASS + 1)); }
bad() { printf '  FAIL %s\n' "$1"; FAIL=$((FAIL + 1)); }

for f in "$RATCHET" "$BASELINE" "$WORKFLOW"; do
  if [ ! -f "$f" ]; then
    echo "::error::${f} not found — the ratchet this suite exists to prove has been moved or deleted."
    exit 1
  fi
done

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ---------------------------------------------------------------------------
# Fixture builder: a root package that depends on `a`, where `a` declares a
# peer on `b`. The third argument decides what `b` is installed as:
#   1.0.0  -> satisfies a's `^1`      (clean)
#   2.0.0  -> violates a's `^1`       (INVALID)
#   none   -> not installed at all    (MISSING)
# ---------------------------------------------------------------------------
mk_tree() {
  local dir="$1" b_version="$2"
  mkdir -p "${dir}/node_modules/a"
  printf '{"name":"fixture-root","version":"0.0.0","dependencies":{"a":"^1.0.0"}}\n' >"${dir}/package.json"
  printf '{"name":"a","version":"1.0.0","peerDependencies":{"b":"^1"}}\n' >"${dir}/node_modules/a/package.json"
  if [ "$b_version" != "none" ]; then
    mkdir -p "${dir}/node_modules/b"
    printf '{"name":"b","version":"%s"}\n' "$b_version" >"${dir}/node_modules/b/package.json"
  fi
}

mk_baseline() {
  # $1 = file, $2 = nodeFloor, remaining = keys to include
  local file="$1" floor="$2"; shift 2
  {
    printf '{"nodeFloor": %s, "entries": {' "$floor"
    local first=1
    for k in "$@"; do
      [ $first -eq 1 ] || printf ','
      first=0
      printf '"%s": {"since": "2026-01-01", "note": "fixture"}' "$k"
    done
    printf '}}\n'
  } >"$file"
}

CONFLICT_KEY='a -> b@^1 [peer/INVALID]'
MISSING_KEY='a -> b@^1 [peer/MISSING]'

mk_tree "${TMP}/clean"    1.0.0
mk_tree "${TMP}/conflict" 2.0.0
mk_tree "${TMP}/missing"  none
mk_baseline "${TMP}/empty.json"    1
mk_baseline "${TMP}/accepted.json" 1 "$CONFLICT_KEY"
mk_baseline "${TMP}/floor.json"    1000

run() { node "$RATCHET" "$@" 2>&1; }

# ---------------------------------------------------------------------------
# 1. 🚨 THE DENYING CASE — a real INVALID peer edge, empty baseline, must FAIL
#    and must NAME the edge.
# ---------------------------------------------------------------------------
echo "== 🚨 A NEW PEER CONFLICT MUST FAIL =="
OUT="$(run --tree "${TMP}/conflict" --baseline "${TMP}/empty.json")"; RC=$?
if [ "$RC" -ne 0 ]; then
  ok "conflict tree, empty baseline: exit ${RC}"
else
  bad "conflict tree, empty baseline PASSED — the ratchet cannot fail, so it proves nothing"
fi
if printf '%s' "$OUT" | grep -qF -- "$CONFLICT_KEY"; then
  ok "the failure names the edge: ${CONFLICT_KEY}"
else
  bad "the failure does not name the edge; output was: ${OUT}"
fi
if printf '%s' "$OUT" | grep -q "resolved: 2.0.0"; then
  ok "the failure reports what was actually resolved (2.0.0)"
else
  bad "the failure does not report the resolved version"
fi

# ---------------------------------------------------------------------------
# 2. THE CLEAN CASE, SAME RUN — proves the red above was the screen, not an
#    outage. Same scanner, same baseline, satisfied peer: must PASS.
# ---------------------------------------------------------------------------
echo "== THE CLEAN TREE MUST PASS (same scanner, same baseline) =="
OUT="$(run --tree "${TMP}/clean" --baseline "${TMP}/empty.json")"; RC=$?
if [ "$RC" -eq 0 ]; then
  ok "clean tree, empty baseline: exit 0"
else
  bad "clean tree FAILED (exit ${RC}) — the scanner is broken, so case 1 proved nothing: ${OUT}"
fi
if printf '%s' "$OUT" | grep -q "scanned [1-9][0-9]* installed packages"; then
  ok "the pass line reports a non-zero installed-package count (the scan saw the tree)"
else
  bad "the pass line does not show what was scanned: ${OUT}"
fi

# ---------------------------------------------------------------------------
# 3. THE RATCHET DIRECTION — the same conflict, ACCEPTED in the baseline, must
#    PASS. This is what lets the repo keep shipping over react-query v3.
# ---------------------------------------------------------------------------
echo "== AN ACCEPTED CONFLICT MUST PASS =="
OUT="$(run --tree "${TMP}/conflict" --baseline "${TMP}/accepted.json")"; RC=$?
if [ "$RC" -eq 0 ]; then
  ok "conflict tree, conflict in baseline: exit 0"
else
  bad "an accepted conflict FAILED (exit ${RC}) — the baseline is not being honoured: ${OUT}"
fi

# ---------------------------------------------------------------------------
# 4. A STALE BASELINE ENTRY IS A FAILURE — a resolved conflict must be removed
#    from the baseline in the same PR, so the baseline can only shrink honestly.
# ---------------------------------------------------------------------------
echo "== 🚨 A STALE BASELINE ENTRY MUST FAIL =="
OUT="$(run --tree "${TMP}/clean" --baseline "${TMP}/accepted.json")"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -q "no longer observed"; then
  ok "clean tree, baseline still lists the conflict: exit ${RC}, asks for the entry to be removed"
else
  bad "a stale baseline entry did not fail (exit ${RC}): ${OUT}"
fi

# ---------------------------------------------------------------------------
# 5. A MISSING peer is a distinct key from an INVALID one, and is caught.
# ---------------------------------------------------------------------------
echo "== 🚨 A MISSING PEER MUST FAIL, AS ITS OWN KEY =="
OUT="$(run --tree "${TMP}/missing" --baseline "${TMP}/empty.json")"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qF -- "$MISSING_KEY"; then
  ok "missing peer: exit ${RC}, names ${MISSING_KEY}"
else
  bad "a missing peer was not caught as ${MISSING_KEY} (exit ${RC}): ${OUT}"
fi
OUT="$(run --tree "${TMP}/missing" --baseline "${TMP}/accepted.json")"; RC=$?
if [ "$RC" -ne 0 ]; then
  ok "missing peer is NOT excused by an INVALID entry for the same edge (exit ${RC})"
else
  bad "an INVALID baseline entry excused a MISSING peer — the keys have collapsed"
fi

# ---------------------------------------------------------------------------
# 6. 🚨 THE CONTROL — an empty or partial tree cannot pass. A clean tree that
#    is smaller than nodeFloor is a scan that proved nothing.
# ---------------------------------------------------------------------------
echo "== 🚨 A TREE BELOW THE NODE FLOOR MUST FAIL =="
OUT="$(run --tree "${TMP}/clean" --baseline "${TMP}/floor.json")"; RC=$?
if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -q "below the baseline floor"; then
  ok "clean tree of 2 installed packages vs nodeFloor 1000: exit ${RC}"
else
  bad "a tree below the floor passed (exit ${RC}) — an uninstalled tree would read as clean: ${OUT}"
fi
mkdir -p "${TMP}/nothing"
printf '{"name":"nothing","version":"0.0.0"}\n' >"${TMP}/nothing/package.json"
OUT="$(run --tree "${TMP}/nothing" --baseline "${TMP}/empty.json")"; RC=$?
if [ "$RC" -ne 0 ]; then
  ok "a tree with no node_modules at all fails (exit ${RC}) even against an empty baseline"
else
  bad "a tree with NO node_modules passed — that is exactly the vacuous pass this file exists to prevent"
fi

# ---------------------------------------------------------------------------
# 7. Unreadable inputs are failures, never silent passes.
# ---------------------------------------------------------------------------
echo "== GARBAGE IN IS A FAILURE, NOT A PASS =="
printf '{"entries": {}}\n' >"${TMP}/nofloor.json"
OUT="$(run --tree "${TMP}/clean" --baseline "${TMP}/nofloor.json")"; RC=$?
if [ "$RC" -ne 0 ]; then
  ok "a baseline without nodeFloor is rejected (exit ${RC})"
else
  bad "a baseline without nodeFloor was accepted — the control can be deleted silently"
fi
OUT="$(run --tree "${TMP}/clean" --baseline "${TMP}/does-not-exist.json")"; RC=$?
if [ "$RC" -ne 0 ]; then
  ok "a missing baseline file is rejected (exit ${RC})"
else
  bad "a missing baseline file passed"
fi
OUT="$(run --tree "${TMP}/clean" --baseline "${TMP}/empty.json" --bogus)"; RC=$?
if [ "$RC" -ne 0 ]; then
  ok "an unknown argument is rejected (exit ${RC})"
else
  bad "an unknown argument was ignored"
fi

# ---------------------------------------------------------------------------
# 8. The REAL baseline is not vacuous, and every entry carries a reason.
# ---------------------------------------------------------------------------
echo "== THE REAL BASELINE IS POPULATED AND EXPLAINED =="
REAL_FLOOR="$(node -e 'const b=require(process.argv[1]);console.log(b.nodeFloor)' "$BASELINE")"
REAL_COUNT="$(node -e 'const b=require(process.argv[1]);console.log(Object.keys(b.entries).length)' "$BASELINE")"
UNEXPLAINED="$(node -e 'const b=require(process.argv[1]);console.log(Object.entries(b.entries).filter(([,v])=>!v||typeof v.note!=="string"||v.note.length<20||/^TODO/.test(v.note)).map(([k])=>k).join("\n"))' "$BASELINE")"
if [ "$REAL_FLOOR" -ge 500 ]; then
  ok "real baseline nodeFloor is ${REAL_FLOOR} (>= 500, so an uninstalled tree cannot pass the real gate; dev installs 890)"
else
  bad "real baseline nodeFloor is ${REAL_FLOOR} — too low to reject a partial install"
fi
if [ "$REAL_COUNT" -ge 1 ]; then
  ok "real baseline lists ${REAL_COUNT} accepted conflict(s)"
else
  bad "real baseline is EMPTY — either every conflict was retired (then delete this check) or the file was blanked"
fi
# 🚨 The #285 headline: eslint-config-next's nested plugins peer eslint <= 9
# against the eslint@10 this repo installs. If that is ever retired, the
# entries must go in the SAME PR — `decide()` already fails on a stale entry,
# but this pins that the baseline we ship is the one we measured, not an empty
# file that happens to satisfy the loop above.
if node -e 'const b=require(process.argv[1]);process.exit(Object.keys(b.entries).some(k=>k.startsWith("eslint-config-next -> eslint@"))?0:1)' "$BASELINE"; then
  ok "real baseline carries the #285 headline (eslint-config-next -> eslint)"
else
  bad "real baseline no longer carries eslint-config-next -> eslint — if the flat-config migration landed, say so in #285 in the same PR"
fi
if [ -z "$UNEXPLAINED" ]; then
  ok "every real baseline entry has a note explaining why it is accepted"
else
  bad "baseline entries without a real note (a conflict nobody decided about): ${UNEXPLAINED}"
fi

# ---------------------------------------------------------------------------
# 9. ANCHORS — the workflow actually runs the ratchet as a HARD gate, and runs
#    this suite before trusting it. Anchored on `run:` lines, not on prose.
# ---------------------------------------------------------------------------
echo "== 🚨 THE WORKFLOW RUNS THE RATCHET, HARD, AND RUNS THIS SUITE =="
if grep -qE '^          bash infra/ci/__tests__/peer-conflict-ratchet\.test\.sh$' "$WORKFLOW"; then
  ok "this suite is executed by pre-merge-checks.yml (anchored on the run: line, not on prose)"
else
  bad "this suite is not executed by pre-merge-checks.yml — an unrun self-test proves nothing"
fi
GATE_LINE="$(grep -nE '^        run: node infra/ci/peer-conflict-ratchet\.mjs$' "$WORKFLOW" | head -1)"
if [ -n "$GATE_LINE" ]; then
  ok "next-build runs \`node infra/ci/peer-conflict-ratchet.mjs\` (anchored)"
  LINE_NO="${GATE_LINE%%:*}"
  # The step is the 8 lines ending at the run: line; a continue-on-error or an
  # if: inside that window softens the gate.
  WINDOW="$(sed -n "$((LINE_NO > 8 ? LINE_NO - 8 : 1)),${LINE_NO}p" "$WORKFLOW" | grep -vE '^\s*#')"
  if printf '%s\n' "$WINDOW" | grep -qE 'continue-on-error|^\s+if:'; then
    bad "the ratchet step carries continue-on-error or an if: — it is not a hard gate"
  else
    ok "the ratchet step has no continue-on-error and no if: — it is a HARD gate"
  fi
else
  bad "next-build does not run the ratchet — the baseline is decorative"
fi

# 🚨 The ratchet must run AFTER the install, or it scans an empty tree. The
# nodeFloor would catch that, but as a red gate on every PR rather than as the
# ordering bug it is — so pin the ordering here, where the message is useful.
INSTALL_LINE="$(grep -nE '^        run: npm ci --legacy-peer-deps --no-audit --no-fund$' "$WORKFLOW" | head -1)"
if [ -n "$INSTALL_LINE" ] && [ -n "$GATE_LINE" ] && [ "${INSTALL_LINE%%:*}" -lt "${GATE_LINE%%:*}" ]; then
  ok "the ratchet step comes AFTER the install step (line ${INSTALL_LINE%%:*} < ${GATE_LINE%%:*})"
else
  bad "the ratchet does not run after \`npm ci --legacy-peer-deps\` — it would scan an uninstalled tree"
fi

echo
echo "----"
echo "passed: ${PASS}"
echo "failed: ${FAIL}"

if [ "$PASS" -eq 0 ]; then
  echo "::error::peer-conflict-ratchet.test.sh asserted NOTHING — an empty pass is the failure mode this file exists to prevent."
  exit 1
fi
if [ "$FAIL" -ne 0 ]; then
  echo "::error::peer-conflict-ratchet.test.sh failed (${FAIL} assertion(s)). Do NOT merge: either the ratchet stopped denying, or the workflow stopped gating on it (Next-ShopFront#285)."
  exit 1
fi
echo "peer-conflict-ratchet.test.sh PASSED (${PASS} assertions)"
