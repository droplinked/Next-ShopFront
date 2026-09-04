#!/usr/bin/env bash
# Decide the ONE status context branch protection should require on this repo.
#
# ---------------------------------------------------------------------------
# WHY THIS FILE EXISTS
# ---------------------------------------------------------------------------
# `pre-merge-checks.yml` holds this repo's only pre-merge gate: `next build`
# plus the post-build `tsc --noEmit`, which together are what stands between a
# broken commit and an undeployable shop.droplinked.com — the SSR surface for
# all 23,025 ACP feed product URLs. `next-build` is the job that runs them.
#
# `next-build` cannot be required directly. It is SKIPPED on a docs-only PR,
# and a SKIPPED required check never reports a conclusion — GitHub pins it at
# PENDING forever. That is the same permanent-pending deadlock a `paths-ignore`
# trigger causes, one layer down: moving the docs filter from the trigger into
# the body fixes the workflow-level case and recreates the job-level case for
# every job the filter now skips.
#
# So exactly one job runs with `if: always()`, reads the `result` of every job
# that can gate, and decides. This script IS that decision, extracted from the
# workflow so it can be driven through its whole truth table by
# `infra/ci/__tests__/pre-merge-gate-decide.test.sh` — including the cases
# where it must FAIL. A gate that has only ever been observed passing is
# indistinguishable from a gate that cannot fail.
#
# ---------------------------------------------------------------------------
# 🚨 THE FAILURE MODE THIS SCRIPT MUST NEVER HAVE
# ---------------------------------------------------------------------------
# Exiting 0 for a PR whose `next-build` job actually FAILED would report green
# while nothing was measured — strictly worse than the deadlock it replaces,
# because a deadlock is visible and an ungated branch is not.
#
# Every branch is therefore an ALLOW-list of results, never a deny-list:
#
#   1. `changes` must have RUN AND SUCCEEDED. If the classifier crashed, was
#      cancelled or was skipped, nothing downstream can be interpreted and the
#      gate fails. It never falls back to "probably fine".
#   2. Its `docs_only` output must be literally `true` or `false`. An empty
#      string — what a crashed job yields — is neither, and fails.
#   3. On a CODE PR, every gating job must report exactly `success`.
#      `skipped`, `cancelled` and `failure` all fail.
#   4. On a DOCS-ONLY PR the gating jobs are expected to be `skipped`, but a
#      job that ran anyway still has its result honoured: only `skipped` or
#      `success` are accepted, so a `failure` still fails the gate.
#
# Usage (all three values come from the `needs` context of the calling job):
#   CHANGES_RESULT=... DOCS_ONLY=... NEXT_BUILD_RESULT=... \
#     bash infra/ci/pre-merge-gate-decide.sh
#
# Exit code: 0 = the PR may merge, 1 = it may not. Nothing else.

set -uo pipefail

CHANGES_RESULT="${CHANGES_RESULT-}"
DOCS_ONLY="${DOCS_ONLY-}"
NEXT_BUILD_RESULT="${NEXT_BUILD_RESULT-}"

echo "changes:     ${CHANGES_RESULT}  (docs_only='${DOCS_ONLY}')"
echo "next-build:  ${NEXT_BUILD_RESULT}"

fail() {
  echo "::error title=pre-merge-gate::$1"
  exit 1
}

# ── 1. the classifier must have run and succeeded ───────────────────────────
if [ "$CHANGES_RESULT" != "success" ]; then
  fail "the 'changes' job reported '${CHANGES_RESULT}', not 'success'. Every decision below reads its output, so an unavailable classification is not a pass — it is an unknown, and an unknown must not merge."
fi

# ── 2. its output must be one of the two answers it is allowed to give ──────
case "$DOCS_ONLY" in
  true | false) ;;
  *)
    fail "the 'changes' job produced docs_only='${DOCS_ONLY}'; expected exactly 'true' or 'false'. An empty or unexpected value is what a crashed step yields, and it is never a licence to skip the build."
    ;;
esac

# ── 3/4. the gating jobs ────────────────────────────────────────────────────
# One space-separated `job:result` pair per gating job. Adding a job to
# `needs:` means adding it here AND to the test suite's truth table.
GATING="next-build:${NEXT_BUILD_RESULT}"

if [ "$DOCS_ONLY" = "true" ]; then
  for pair in $GATING; do
    job="${pair%%:*}"
    res="${pair#*:}"
    case "$res" in
      skipped | success) ;;
      *)
        fail "this PR classified as docs-only, but '${job}' reported '${res}'. A docs-only classification skips the heavy job; it does NOT excuse one that ran and did not pass."
        ;;
    esac
  done
  echo
  echo "PASS — docs-only PR. Every changed path is in the allow-list in"
  echo "infra/ci/docs-only-paths.sh, so the build was deliberately skipped"
  echo "and this context reports success in well under a minute instead of"
  echo "sitting at pending forever."
  exit 0
fi

for pair in $GATING; do
  job="${pair%%:*}"
  res="${pair#*:}"
  if [ "$res" != "success" ]; then
    fail "'${job}' reported '${res}'. On a code-touching PR nothing but 'success' passes this gate — 'skipped' and 'cancelled' included, because a job that did not run has proven nothing."
  fi
done

echo
echo "PASS — code PR. 'next-build' ran: npm ci --legacy-peer-deps (the"
echo "Dockerfile's install), next build, and the POST-BUILD tsc --noEmit all"
echo "succeeded."
exit 0
