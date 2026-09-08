#!/usr/bin/env bash
# lockfile-pr-gate-assert.sh — assert the ARTIFACT: after the lockfile PR is
# opened, are its `pull_request` checks actually running?
#
# A green "Open PR" step proves a PR exists, not that it is gated. Measured
# 2026-09-08 on 7 lockfile PRs across 5 repos: every gate workflow DID create a
# run within 4s of PR creation, and every run was completed/action_required
# with ZERO jobs — so `gh pr checks` printed "no checks reported" while the run
# list looked populated. Counting runs is not enough; the CONCLUSION is the
# signal. Tracking: droplinked-backend#3781.
#
# Verdict over the head SHA's workflow runs:
#   gated              >=1 pull_request run and none is action_required
#   awaiting-approval  >=1 pull_request run is action_required (a human must approve)
#   ungated            no pull_request run at all (CodeQL's `dynamic` runs do not count)
#
# Policy: with a trusted identity (app|pat) anything but `gated` is a FAILURE —
# the identity is misconfigured and this job must say so. With github-token the
# step warns and exits 0 (fail-open: the refresh still ships) and prints the
# exact approve commands so the rescue is one paste, not a search.
#
# Usage:
#   lockfile-pr-gate-assert.sh classify <kind> <runs.json>   # pure; array of {id,name,event,status,conclusion}
#   lockfile-pr-gate-assert.sh wait <owner/repo> <sha> <kind> [timeout_s]   # polls, then classifies
#   lockfile-pr-gate-assert.sh self-test
set -uo pipefail

verdict_of() { # <runs-json>  -> gated | awaiting-approval | ungated
  local runs="$1" pr_runs pending
  pr_runs=$(jq -r '[.[] | select(.event=="pull_request")] | length' <<<"$runs")
  pending=$(jq -r '[.[] | select(.event=="pull_request" and .conclusion=="action_required")] | length' <<<"$runs")
  if   [ "$pr_runs" -eq 0 ]; then echo ungated
  elif [ "$pending" -gt 0 ]; then echo awaiting-approval
  else echo gated; fi
}

pending_ids() { jq -r '.[] | select(.event=="pull_request" and .conclusion=="action_required") | "\(.id)\t\(.name)"' <<<"$1"; }

is_trusted() { [ "$1" = app ] || [ "$1" = pat ]; }

# enforce <kind> <verdict>  -> 0 ok, 1 denied
enforce() {
  local kind="$1" verdict="$2"
  case "$verdict" in
    gated) return 0 ;;
    awaiting-approval|ungated)
      if is_trusted "$kind"; then
        echo "::error title=Lockfile PR is NOT gated::Identity '$kind' opened the PR but its pull_request runs are '$verdict'. A trusted identity must produce running checks — the App/PAT is misconfigured (permissions, repository access, or an expired key)." >&2
        return 1
      fi
      echo "::warning title=Lockfile PR awaiting approval::Opened with github.token; verdict='$verdict'. A maintainer must approve its runs (commands are in the PR comment). Configure CI_BOT_APP_ID + CI_BOT_APP_PRIVATE_KEY to make this automatic — droplinked-backend#3781." >&2
      return 0 ;;
    *) echo "::error::unknown verdict '$verdict'" >&2; return 1 ;;
  esac
}

emit_outputs() { # <verdict> <runs-json>
  [ -n "${GITHUB_OUTPUT-}" ] || return 0
  { echo "verdict=$1"; echo 'pending<<PENDING_EOF'; pending_ids "$2"; echo 'PENDING_EOF'; } >> "$GITHUB_OUTPUT"
}

cmd_classify() {
  local kind="$1" file="$2" runs v
  runs="$(cat "$file")"
  v="$(verdict_of "$runs")"
  echo "verdict=$v"
  emit_outputs "$v" "$runs"
  enforce "$kind" "$v"
}

cmd_wait() {
  local repo="$1" sha="$2" kind="$3" timeout="${4:-90}" waited=0 runs v
  fetch() { gh api "repos/$repo/actions/runs?head_sha=$sha&per_page=100" --jq '[.workflow_runs[] | {id,name,event,status,conclusion}]' 2>/dev/null || echo '[]'; }
  while :; do
    runs="$(fetch)"; v="$(verdict_of "$runs")"
    if [ "$v" != ungated ] || [ "$waited" -ge "$timeout" ]; then break; fi
    sleep 10; waited=$((waited+10))
  done
  # Runs appear within seconds but their conclusion can settle a beat later; re-sample once.
  if [ "$v" != ungated ]; then sleep 10; waited=$((waited+10)); runs="$(fetch)"; v="$(verdict_of "$runs")"; fi
  echo "verdict=$v (after ${waited}s)"
  jq -r '.[] | "  run=\(.id) \(.name) event=\(.event) status=\(.status) conclusion=\(.conclusion)"' <<<"$runs"
  emit_outputs "$v" "$runs"
  enforce "$kind" "$v"
}

cmd_self_test() {
  local pass=0 fail=0
  ok()  { printf '  PASS: %s\n' "$1"; pass=$((pass+1)); }
  bad() { printf '  FAIL: %s\n' "$1"; fail=$((fail+1)); }
  local F_GATED F_PENDING F_PARTIAL F_NONE F_DYNAMIC_ONLY
  F_GATED='[{"id":1,"name":"pre-merge-checks","event":"pull_request","status":"queued","conclusion":null},{"id":2,"name":"CodeQL","event":"dynamic","status":"completed","conclusion":"success"}]'
  F_PENDING='[{"id":1,"name":"pre-merge-checks","event":"pull_request","status":"completed","conclusion":"action_required"}]'
  F_PARTIAL='[{"id":1,"name":"pre-merge-checks","event":"pull_request","status":"in_progress","conclusion":null},{"id":3,"name":"gitleaks","event":"pull_request","status":"completed","conclusion":"action_required"}]'
  F_NONE='[]'
  # The #3781 trap: three CodeQL checks from an unrelated `dynamic` trigger and no gate at all.
  F_DYNAMIC_ONLY='[{"id":9,"name":"PR #259","event":"dynamic","status":"completed","conclusion":"success"}]'
  expect_verdict() { local want="$1" name="$2" got; got="$(verdict_of "$3")"; if [ "$got" = "$want" ]; then ok "$name -> $got"; else bad "$name: want=$want got=$got"; fi; }
  echo "== verdicts =="
  expect_verdict gated             "queued pull_request run"                    "$F_GATED"
  expect_verdict awaiting-approval "action_required pull_request run"           "$F_PENDING"
  expect_verdict awaiting-approval "one running, one action_required"           "$F_PARTIAL"
  expect_verdict ungated           "no runs at all"                             "$F_NONE"
  expect_verdict ungated           "only CodeQL dynamic runs (the #3781 trap)"  "$F_DYNAMIC_ONLY"
  echo "== policy: the DENIAL cases (load-bearing) =="
  if enforce app awaiting-approval 2>/dev/null; then bad "app + awaiting-approval ACCEPTED"; else ok "app + awaiting-approval DENIED (exit 1)"; fi
  if enforce app ungated 2>/dev/null;           then bad "app + ungated ACCEPTED";           else ok "app + ungated DENIED (exit 1)"; fi
  if enforce pat ungated 2>/dev/null;           then bad "pat + ungated ACCEPTED";           else ok "pat + ungated DENIED (exit 1)"; fi
  if enforce app bogus 2>/dev/null;             then bad "unknown verdict ACCEPTED";         else ok "unknown verdict DENIED"; fi
  echo "== policy: the clean and fail-open cases =="
  if enforce app gated 2>/dev/null;                       then ok "app + gated passes";                          else bad "app + gated rejected"; fi
  if enforce pat gated 2>/dev/null;                       then ok "pat + gated passes";                          else bad "pat + gated rejected"; fi
  if enforce github-token awaiting-approval 2>/dev/null;  then ok "github-token + awaiting-approval fails OPEN";  else bad "github-token + awaiting-approval rejected"; fi
  if enforce github-token ungated 2>/dev/null;            then ok "github-token + ungated fails OPEN";            else bad "github-token + ungated rejected"; fi
  echo "== classify end-to-end (file + GITHUB_OUTPUT) =="
  local tmp f; tmp="$(mktemp)"; f="$(mktemp)"
  printf '%s' "$F_PARTIAL" > "$f"
  if GITHUB_OUTPUT="$tmp" cmd_classify app "$f" >/dev/null 2>&1; then bad "classify app on partial exited 0"; else ok "classify app on partial exits 1"; fi
  if grep -qx 'verdict=awaiting-approval' "$tmp" && grep -qE '^3	gitleaks$' "$tmp"; then ok "GITHUB_OUTPUT carries verdict and the pending run id"; else bad "GITHUB_OUTPUT wrong: $(cat "$tmp")"; fi
  rm -f "$tmp" "$f"
  echo "----"; echo "passed: $pass"; echo "failed: $fail"
  [ "$fail" -eq 0 ] && [ "$pass" -gt 0 ]
}

case "${1-}" in
  classify)  cmd_classify "$2" "$3" ;;
  wait)      cmd_wait "$2" "$3" "$4" "${5-}" ;;
  self-test) cmd_self_test ;;
  *) echo "usage: $0 classify <kind> <runs.json> | wait <owner/repo> <sha> <kind> [timeout_s] | self-test" >&2; exit 2 ;;
esac
