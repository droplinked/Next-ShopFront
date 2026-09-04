#!/usr/bin/env bash
# Regression test for infra/ci/pre-merge-gate-decide.sh — the decision behind
# `pre-merge-gate`, the one status context branch protection should require on
# this repo.
#
# ---------------------------------------------------------------------------
# THE LOAD-BEARING ASSERTIONS ARE THE FAILING ONES
# ---------------------------------------------------------------------------
# A companion gate that always passes is exactly the "reports green without
# measuring" defect — and it is strictly worse than the permanent-pending
# deadlock it replaces, because a deadlock is visible and an ungated branch is
# not. So the cases that matter most here are the ones where the gate MUST exit
# non-zero: `next-build` failed, `next-build` was skipped on a code-touching
# PR, the classifier crashed, the classifier emitted garbage.
#
# The whole truth table is driven through the REAL script via the SAME
# interface the workflow uses (three env vars, exit code as the answer), so
# what is proven is what executes.
#
# The second half asserts the WIRING, because a correct decision the workflow
# does not consult proves nothing — and because the two nastiest regressions
# are both invisible in the decision script:
#
#   * dropping the gate job's JOB-LEVEL `if: always()`  (it stops reporting)
#   * RENAMING the `pre-merge-gate` context             (it stops reporting)
#
# Both leave a workflow that looks fixed and a suite that reads green while the
# required context never arrives again. Both are asserted below with ANCHORED
# WHOLE-LINE matches against a BOUNDED slice of the file, for reasons written
# at each assertion.
#
# Usage:  bash infra/ci/__tests__/pre-merge-gate-decide.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DECIDE="${REPO_ROOT}/infra/ci/pre-merge-gate-decide.sh"
WORKFLOW="${REPO_ROOT}/.github/workflows/pre-merge-checks.yml"
WORKFLOW_DIR="${REPO_ROOT}/.github/workflows"

PASS=0
FAIL=0
ok() {
  printf '  ok   %s\n' "$1"
  PASS=$((PASS + 1))
}
bad() {
  printf '  FAIL %s\n' "$1"
  FAIL=$((FAIL + 1))
}

if [ ! -f "$DECIDE" ]; then
  echo "::error::${DECIDE} not found — the gate this suite exists to prove has been moved or deleted."
  exit 1
fi

# gate <expected: pass|fail> <label> <changes> <docs_only> <next-build>
gate() {
  expected="$1"
  label="$2"
  CHANGES_RESULT="$3" DOCS_ONLY="$4" NEXT_BUILD_RESULT="$5" \
    bash "$DECIDE" >/dev/null 2>&1
  rc=$?
  if [ "$expected" = "pass" ]; then
    if [ "$rc" -eq 0 ]; then ok "$label"; else bad "$label (expected exit 0, got ${rc})"; fi
  else
    if [ "$rc" -ne 0 ]; then ok "$label"; else bad "$label (expected a NON-zero exit, got 0 — THE GATE WOULD HAVE REPORTED GREEN)"; fi
  fi
}

assert_contains() {
  if printf '%s' "$1" | grep -qF -- "$2"; then ok "$3"; else bad "$3 — expected to find: $2"; fi
}
assert_not_contains() {
  if printf '%s' "$1" | grep -qF -- "$2"; then bad "$3 — should NOT contain: $2"; else ok "$3"; fi
}

# 🚨 ANCHORED WHOLE-LINE match against a slice, never a substring search.
#
# A substring test for `name: pre-merge-gate` is satisfied by
# `name: pre-merge-gate-v2`. Branch protection pins a context as an EXACT
# string, so a rename would leave the required context permanently unreported
# while this suite still read green — the workflow looks fixed, the check never
# arrives, every PR wedges at pending. A rename is the nastiest shape of this
# whole class of defect, so the assertion has to be exact too.
assert_line() {
  if printf '%s\n' "$1" | grep -qE "$2"; then ok "$3"; else bad "$3 — no line matching /$2/"; fi
}

echo "== the gate PASSES only in these states =="
gate pass "code PR, next-build succeeded" success false success
gate pass "docs-only PR, next-build skipped as intended" success true skipped
gate pass "docs-only PR where next-build ran anyway and passed" success true success

echo
echo "== 🚨 A GENUINE FAILURE MUST STILL FAIL — the direction that matters =="
gate fail "code PR, next-build FAILED (a broken next build / tsc error)" success false failure
gate fail "code PR, next-build CANCELLED (timeout / concurrency)" success false cancelled

echo
echo "== 🚨 A SKIPPED JOB ON A CODE PR IS A FAILURE, NOT A PASS =="
# The deadlock's mirror image: a job that did not run has proven nothing and
# must never be read as agreement.
gate fail "code PR, next-build SKIPPED (the un-gated shape)" success false skipped

echo
echo "== 🚨 A DOCS-ONLY CLASSIFICATION DOES NOT EXCUSE A JOB THAT RAN AND FAILED =="
gate fail "docs-only, but next-build ran and FAILED" success true failure
gate fail "docs-only, but next-build was cancelled" success true cancelled

echo
echo "== 🚨 AN UNAVAILABLE CLASSIFICATION IS NEVER A PASS (fail closed) =="
gate fail "the changes job FAILED" failure "" skipped
gate fail "the changes job was CANCELLED" cancelled "" skipped
gate fail "the changes job was SKIPPED" skipped "" skipped
gate fail "changes failed but claims docs-only anyway" failure true skipped
gate fail "changes failed on an otherwise green PR" failure false success
gate fail "changes succeeded with an EMPTY docs_only output" success "" skipped
gate fail "changes succeeded with an empty output on a green PR" success "" success
gate fail "docs_only='TRUE' (wrong case) is not 'true'" success TRUE skipped
gate fail "docs_only='True' (wrong case) is not 'true'" success True skipped
gate fail "docs_only='yes' is not a valid answer" success yes skipped
gate fail "docs_only='1' is not a valid answer" success 1 skipped
gate fail "docs_only='true false' (garbage) is not valid" success "true false" skipped
gate fail "docs_only=' true' (leading space) is not 'true'" success " true" skipped

echo
echo "== workflow wiring: pre-merge-checks.yml =="
if [ ! -f "$WORKFLOW" ]; then
  bad "pre-merge-checks.yml not found at ${WORKFLOW}"
else
  # 🚨 Two DIFFERENT slices, on purpose.
  #
  # GATE_BLOCK is the job id to end of file — right for "does the job run the
  # decision script / does it pass the env vars".
  #
  # GATE_HEADER is the job id down to its FIRST `steps:` — the job's own
  # attributes and nothing else. Asserting `if: always()` against GATE_BLOCK
  # instead would be satisfied by the summary STEP's `if: always()` further
  # down, so deleting the JOB-LEVEL one — the single edit that makes the
  # required context stop reporting — would pass. That exact mutation escaped
  # an earlier draft of this suite in the sibling repo; it is bounded here.
  GATE_BLOCK="$(sed -n '/^  pre-merge-gate:/,$p' "$WORKFLOW")"
  GATE_HEADER="$(sed -n '/^  pre-merge-gate:/,/^    steps:/p' "$WORKFLOW")"

  if [ -z "$GATE_HEADER" ]; then
    bad "🚨 no 'pre-merge-gate:' job found in pre-merge-checks.yml at all"
  fi

  assert_line "$(cat "$WORKFLOW")" '^    name: pre-merge-gate$' \
    "🚨 the workflow emits the EXACT 'pre-merge-gate' context branch protection pins (anchored whole-line: a rename to pre-merge-gate-v2 must FAIL this)"

  assert_line "$GATE_HEADER" '^    if: always\(\)$' \
    "🚨 the gate JOB itself carries if: always(), so it reports even when next-build fails or skips"

  assert_line "$GATE_HEADER" '^    needs: \[changes, next-build\]$' \
    "the gate covers BOTH the classifier and the build job"

  # 🚨 ANCHORED on the executable `run:` line, not a substring of the block.
  # The job's header comment names this script path twice, so a substring test
  # is satisfied by the PROSE even after the `run:` that actually executes it
  # has been changed. The equivalent substring assertion on the install line in
  # docs-only-paths.test.sh let a real mutation escape; this is the same hole,
  # closed in the same way.
  assert_line "$GATE_BLOCK" '^        run: bash infra/ci/pre-merge-gate-decide\.sh$' \
    "the gate job RUNS the decision script this suite tests (anchored on the run: line)"
  assert_not_contains "$GATE_BLOCK" "continue-on-error" \
    "the gate cannot be soft-failed"

  # Anchored per-line too: these are env mappings, and a mapping that only
  # exists in a comment wires nothing.
  assert_line "$GATE_BLOCK" '^          CHANGES_RESULT: \$\{\{ needs\.changes\.result \}\}$' \
    "the gate passes CHANGES_RESULT from the needs context"
  assert_line "$GATE_BLOCK" '^          DOCS_ONLY: \$\{\{ needs\.changes\.outputs\.docs_only \}\}$' \
    "the gate passes DOCS_ONLY from the needs context"
  assert_line "$GATE_BLOCK" '^          NEXT_BUILD_RESULT: \$\{\{ needs\.next-build\.result \}\}$' \
    "the gate passes NEXT_BUILD_RESULT from the needs context"

  # 🚨 The required context must be emitted by EXACTLY ONE workflow. A status
  # context is a bare string: if two workflows both emit `pre-merge-gate`,
  # branch protection cannot say which one it is waiting for, and a green from
  # the wrong one satisfies the requirement. `build` was emitted by five
  # workflows in the sibling repo — that is the class of mistake this guards.
  EMITTERS="$(grep -rlE '^ *name: pre-merge-gate$' "$WORKFLOW_DIR" 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$EMITTERS" = "1" ]; then
    ok "exactly ONE workflow emits the 'pre-merge-gate' context (found ${EMITTERS})"
  else
    bad "🚨 ${EMITTERS} workflows emit 'pre-merge-gate' — a required context must be emitted by exactly one"
  fi
fi

echo
echo "----"
echo "passed: ${PASS}"
echo "failed: ${FAIL}"

if [ "$PASS" -eq 0 ]; then
  echo "::error::pre-merge-gate-decide.test.sh asserted NOTHING — an empty pass is the failure mode this file exists to prevent."
  exit 1
fi

if [ "$FAIL" -ne 0 ]; then
  echo "::error::pre-merge-gate-decide.test.sh failed (${FAIL} assertion(s)). Do NOT merge: a wrong answer here either deadlocks the branch or silently un-gates it."
  exit 1
fi

echo "pre-merge-gate-decide.test.sh PASSED (${PASS} assertions)"
