#!/usr/bin/env bash
# lockfile-pr-identity.sh — decide WHICH IDENTITY opens the lockfile-refresh PR.
#
# WHY THIS EXISTS
# A PR opened with the default GITHUB_TOKEN (github-actions[bot]) gets every one
# of its `pull_request` workflow runs created in an APPROVAL-REQUIRED state:
# conclusion=action_required, zero jobs. That is GitHub's documented behaviour
# since the 2026-06-11 changelog ("Bot-created pull requests can run workflows
# if approved"). Nobody approves them, so `gh pr checks` reports "no checks",
# the merge box says BLOCKED, and after 30 days GitHub deletes the pending runs.
# Measured 2026-09-08 on 7 lockfile PRs across 5 repos. Tracking:
# droplinked-backend#3781.
#
# The fix is an identity GitHub trusts. Precedence, least-privilege first:
#   app           CI_BOT_APP_ID (repo/org VARIABLE) + CI_BOT_APP_PRIVATE_KEY
#                 (SECRET) -> a per-run installation token, scoped down in the
#                 workflow to contents+pull-requests on this repo only.
#   pat           CI_BOT_TOKEN (SECRET) — a fine-grained PAT. The PR's author
#                 becomes the PAT owner, who then cannot approve their own PR.
#                 Second choice for that reason.
#   github-token  nothing configured — LEGACY, FAIL-OPEN. The refresh still
#                 ships and the PR still opens; its checks wait for a human.
#
# CI_BOT_REQUIRED=true (repo VARIABLE) turns the fallback into a hard failure.
# Set it once the App exists, so an expired or rotated key fails LOUDLY instead
# of silently regressing every future refresh to the ungated path.
#
# Usage:
#   lockfile-pr-identity.sh resolve     # env -> prints kind=..., writes $GITHUB_OUTPUT
#   lockfile-pr-identity.sh self-test   # the denial proof; runs on every workflow run
set -uo pipefail

# resolve_kind <app_id> <app_key> <pat>  -> app | pat | github-token
resolve_kind() {
  local app_id="${1-}" app_key="${2-}" pat="${3-}"
  if [ -n "$app_id" ] && [ -n "$app_key" ]; then echo app; return 0; fi
  if [ -n "$app_id" ] || [ -n "$app_key" ]; then
    echo "::warning title=CI bot App half-configured::CI_BOT_APP_ID and CI_BOT_APP_PRIVATE_KEY must BOTH be set; exactly one is. Ignoring the App." >&2
  fi
  if [ -n "$pat" ]; then echo pat; return 0; fi
  echo github-token
}

is_trusted() { [ "$1" = app ] || [ "$1" = pat ]; }

# enforce_policy <kind> <required:true|false>  -> 0 allowed, 1 denied
enforce_policy() {
  local kind="$1" required="${2:-false}"
  if is_trusted "$kind"; then return 0; fi
  if [ "$required" = true ]; then
    echo "::error title=No trusted CI bot identity::CI_BOT_REQUIRED=true but neither CI_BOT_APP_ID+CI_BOT_APP_PRIVATE_KEY nor CI_BOT_TOKEN is configured. Refusing to open a PR whose checks nobody will approve." >&2
    return 1
  fi
  echo "::warning title=Lockfile PR will need manual approval::No CI bot identity is configured, falling back to github.token. The PR's checks will be created in an approval-required state. Configure CI_BOT_APP_ID + CI_BOT_APP_PRIVATE_KEY — droplinked-backend#3781." >&2
  return 0
}

cmd_resolve() {
  local kind
  kind="$(resolve_kind "${CI_BOT_APP_ID-}" "${CI_BOT_APP_PRIVATE_KEY-}" "${CI_BOT_TOKEN-}")"
  echo "kind=$kind"
  if [ -n "${GITHUB_OUTPUT-}" ]; then echo "kind=$kind" >> "$GITHUB_OUTPUT"; fi
  enforce_policy "$kind" "${CI_BOT_REQUIRED:-false}"
}

cmd_self_test() {
  local pass=0 fail=0
  ok()  { printf '  PASS: %s\n' "$1"; pass=$((pass+1)); }
  bad() { printf '  FAIL: %s\n' "$1"; fail=$((fail+1)); }
  expect_kind() { # <want> <name> <app_id> <app_key> <pat>
    local want="$1" name="$2" got; shift 2
    got="$(resolve_kind "$@" 2>/dev/null)"
    if [ "$got" = "$want" ]; then ok "$name -> $got"; else bad "$name: want=$want got=$got"; fi
  }
  echo "== precedence =="
  expect_kind app          "app id + key + pat"                  id key pat
  expect_kind app          "app id + key, no pat"                id key ''
  expect_kind pat          "pat only"                            ''  ''  pat
  expect_kind pat          "app id without key falls to pat"     id  ''  pat
  expect_kind github-token "nothing configured"                  ''  ''  ''
  expect_kind github-token "key without id, no pat"              ''  key ''
  echo "== policy: the DENIAL cases (load-bearing) =="
  if enforce_policy github-token true 2>/dev/null; then bad "required=true ACCEPTED github-token"; else ok "required=true DENIES github-token (exit 1)"; fi
  if CI_BOT_APP_ID='' CI_BOT_APP_PRIVATE_KEY='' CI_BOT_TOKEN='' CI_BOT_REQUIRED=true GITHUB_OUTPUT='' cmd_resolve >/dev/null 2>&1; then bad "resolve with CI_BOT_REQUIRED=true and no identity exited 0"; else ok "resolve with CI_BOT_REQUIRED=true and no identity exits 1"; fi
  echo "== policy: the clean cases =="
  if enforce_policy app true 2>/dev/null;  then ok "required=true accepts app";  else bad "required=true rejected app"; fi
  if enforce_policy pat true 2>/dev/null;  then ok "required=true accepts pat";  else bad "required=true rejected pat"; fi
  if enforce_policy github-token false 2>/dev/null; then ok "required=false fails OPEN on github-token (warn, exit 0)"; else bad "required=false rejected github-token"; fi
  local out
  out="$(CI_BOT_APP_ID=1 CI_BOT_APP_PRIVATE_KEY=k CI_BOT_TOKEN='' CI_BOT_REQUIRED=true GITHUB_OUTPUT='' cmd_resolve 2>/dev/null)"
  if [ "$out" = "kind=app" ]; then ok "resolve via env picks app"; else bad "resolve via env: got '$out'"; fi
  local tmp; tmp="$(mktemp)"
  CI_BOT_APP_ID='' CI_BOT_APP_PRIVATE_KEY='' CI_BOT_TOKEN=t CI_BOT_REQUIRED=false GITHUB_OUTPUT="$tmp" cmd_resolve >/dev/null 2>&1
  if grep -qx 'kind=pat' "$tmp"; then ok "resolve writes kind=pat to GITHUB_OUTPUT"; else bad "GITHUB_OUTPUT missing kind=pat: $(cat "$tmp")"; fi
  rm -f "$tmp"
  echo "----"; echo "passed: $pass"; echo "failed: $fail"
  [ "$fail" -eq 0 ] && [ "$pass" -gt 0 ]
}

case "${1-}" in
  resolve)   cmd_resolve ;;
  self-test) cmd_self_test ;;
  *) echo "usage: $0 resolve|self-test" >&2; exit 2 ;;
esac
