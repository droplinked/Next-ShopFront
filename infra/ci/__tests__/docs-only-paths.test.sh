#!/usr/bin/env bash
# Regression test for infra/ci/docs-only-paths.sh and its wiring into
# .github/workflows/pre-merge-checks.yml.
#
# ---------------------------------------------------------------------------
# WHY THIS FILE EXISTS
# ---------------------------------------------------------------------------
# `pre-merge-checks.yml` deliberately carries NO `paths-ignore:` and NO
# `paths:` on its trigger. A path filter and a required status check are a
# deadlock: when the filter matches, the workflow never starts, the context is
# never reported, and GitHub treats a required check that never arrived as
# PENDING rather than failed. It is not a red check the author can fix; it is
# an ABSENT one, and nothing on the page explains it.
#
# The docs filter therefore lives in the workflow BODY: `changes` classifies
# the diff, `next-build` skips for docs-only PRs, and `pre-merge-gate` always
# reports.
#
# 🚨 THAT DESIGN HAS A FAILURE MODE STRICTLY WORSE THAN THE DEADLOCK IT AVOIDS.
#    If the classifier ever answered "docs-only" for a change set containing a
#    code file, `pre-merge-gate` would report GREEN while `next build` never
#    ran — silently disabling the only real gate this repo has, on the SSR
#    surface serving 23,025 ACP feed product URLs. A deadlock is visible and
#    annoying; an ungated branch is invisible.
#
# So the assertions below are weighted hard toward the *false-green*
# direction. The load-bearing ones are the MIXED change sets: a PR touching a
# doc AND a source file MUST classify false. If someone ever loosens the
# classifier from AND-over-every-path to any-path-matches, those assertions are
# what stops it.
#
# The test drives the REAL script through its real CLI — the same command
# pre-merge-checks.yml runs — so what is proven here is what executes in CI.
# The second half asserts the WIRING, because a correct classifier the workflow
# does not consult proves nothing.
#
# Usage:  bash infra/ci/__tests__/docs-only-paths.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CLASSIFIER="${REPO_ROOT}/infra/ci/docs-only-paths.sh"
WORKFLOW="${REPO_ROOT}/.github/workflows/pre-merge-checks.yml"

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

assert_contains() {
  case "$1" in
    *"$2"*) ok "$3" ;;
    *) bad "$3 — expected to find: $2" ;;
  esac
}
assert_not_contains() {
  case "$1" in
    *"$2"*) bad "$3 — should NOT contain: $2" ;;
    *) ok "$3" ;;
  esac
}
# Anchored whole-line match — see the note in pre-merge-gate-decide.test.sh.
assert_line() {
  if printf '%s\n' "$1" | grep -qE "$2"; then ok "$3"; else bad "$3 — no line matching /$2/"; fi
}

# classify <expected true|false> <description> <path>...
classify() {
  expected="$1"
  desc="$2"
  shift 2
  got="$(bash "$CLASSIFIER" "$@" 2>&1)" || got="EXIT-NONZERO(${got})"
  if [ "$got" = "$expected" ]; then
    ok "$desc"
  else
    bad "$desc — expected '${expected}', got '${got}'"
  fi
}

if [ ! -f "$CLASSIFIER" ]; then
  echo "::error::${CLASSIFIER} not found — pre-merge-checks.yml calls it by path."
  exit 1
fi

echo "== docs-only classifier: paths that ARE in the allow-list =="
# These mirror the `paths-ignore` blocks the deploy workflows carry
# (dev.yml:6-10, main.yml:6-10) plus the GitHub template paths.
classify true "'**.md' — root README" README.md
classify true "'**.md' — CONTRIBUTING.md" CONTRIBUTING.md
classify true "'**.md' — SECURITY.md" SECURITY.md
classify true "'**.md' — BUGS_TO_NEVER_REGRESS.md" BUGS_TO_NEVER_REGRESS.md
classify true "'**.md' — nested markdown" src/components/NOTES.md
classify true "'**.md' — .github/PULL_REQUEST_TEMPLATE.md" .github/PULL_REQUEST_TEMPLATE.md
classify true "'docs/**' — docs/framework.md" docs/framework.md
classify true "'docs/**' — docs/adoption-checklist.md" docs/adoption-checklist.md
classify true "'docs/**' — non-markdown asset under docs/" docs/img/diagram.png
classify true "'docs/**' — deeply nested under docs/" docs/a/b/c/d.txt
classify true "'LICENSE' — root literal" LICENSE
classify true "'.gitignore' — root literal" .gitignore
classify true "'.github/ISSUE_TEMPLATE/**'" .github/ISSUE_TEMPLATE/bug.yml
classify true "several allow-listed paths together" README.md docs/x.png LICENSE .gitignore

echo
echo "== docs-only classifier: paths that are NOT in the allow-list =="
classify false "a Next.js route component" src/app/\(routes\)/checkout/page.tsx
classify false "a React component" src/components/core/header/Header.tsx
classify false "a TypeScript module" src/lib/build-info.mjs
classify false "package.json" package.json
classify false "package-lock.json" package-lock.json
classify false "🚨 the Dockerfile IS the deploy's build recipe" Dockerfile
classify false "next.config.mjs" next.config.mjs
classify false "tsconfig.json" tsconfig.json
classify false "index.d.ts (ambient types, in the tsconfig include)" index.d.ts
classify false "instrumentation.ts" instrumentation.ts
classify false "tailwind.config.ts" tailwind.config.ts
classify false ".eslintrc.json" .eslintrc.json
classify false ".npmrc (it changes how npm resolves)" .npmrc
classify false "a public asset shipped to the browser" public/favicon.ico
classify false "the preinstall supply-chain guard" scripts/preinstall-supply-chain-guard.js
classify false "a helpers module" helpers/format.ts
classify false "a playwright spec" tests/mobile/smoke.spec.ts
classify false "a node:test smoke test" src/__smoke__/build-info.smoke.test.mjs
classify false "an .mdx file is not an .md file" docs.mdx
classify false "a directory merely PREFIXED with docs" docs-internal/plan.ts
classify false "'documentation/' is not 'docs/'" documentation/plan.ts
classify false "'docs-mobile-testing/' is not 'docs/'" docs-mobile-testing/plan.ts
classify false "LICENSE.txt is not LICENSE" LICENSE.txt
classify false "a non-root LICENSE is not the root literal" src/vendor/LICENSE
classify false "a non-root .gitignore is not the root one" src/.gitignore
classify false "ISSUE_TEMPLATE prefix is not the directory" .github/ISSUE_TEMPLATE_evil/x.ts
classify false "an empty path string is never docs" ""

echo
echo "== 🚨 CI-config changes must NEVER be classified docs-only =="
# A workflow edit that skipped the build could disable the gate in the very
# same PR that introduces it.
classify false "this workflow is not a doc" .github/workflows/pre-merge-checks.yml
classify false "main.yml (the prod deploy) is not a doc" .github/workflows/main.yml
classify false "dev.yml (the dev deploy) is not a doc" .github/workflows/dev.yml
classify false "the classifier editing ITSELF is not a doc" infra/ci/docs-only-paths.sh
classify false "the gate decision is not a doc" infra/ci/pre-merge-gate-decide.sh
classify false "this very test file is not a doc" infra/ci/__tests__/docs-only-paths.test.sh
classify false "CODEOWNERS is not a doc" .github/CODEOWNERS
classify false "dependabot config is not a doc" .github/dependabot.yml

echo
echo "== 🚨 THE LOAD-BEARING CASE: mixed change sets are NEVER docs-only =="
# The answer is AND over every path, not OR. One code file is enough.
classify false "README.md + a source file" README.md src/app/layout.tsx
classify false "a source file + README.md (order reversed)" src/app/layout.tsx README.md
classify false "many docs + exactly one source file" README.md docs/a.md docs/b.md LICENSE src/app/layout.tsx
classify false "one source file + many docs (code first)" src/app/layout.tsx README.md docs/a.md LICENSE
classify false "code buried in the middle of docs" docs/a.md README.md src/app/layout.tsx docs/b.md LICENSE
classify false "docs + a workflow change" README.md .github/workflows/main.yml
classify false "docs + package-lock.json" docs/a.md package-lock.json
classify false "docs + the Dockerfile" README.md Dockerfile
classify false "docs + next.config.mjs" docs/framework.md next.config.mjs

echo
echo "== an empty change set is NOT docs-only =="
# A gate that asserted nothing must not be green.
classify false "zero changed files"

echo
echo "== workflow wiring: pre-merge-checks.yml =="
if [ ! -f "$WORKFLOW" ]; then
  bad "pre-merge-checks.yml not found at ${WORKFLOW}"
else
  YML="$(cat "$WORKFLOW")"

  # 1. The trigger must not grow a path filter. That IS the deadlock.
  #    Only the `on:` block matters, so slice it rather than grepping the whole
  #    file (the comments legitimately mention `paths-ignore` many times, and a
  #    naive whole-file grep would fail on its own documentation).
  ON_BLOCK="$(sed -n '/^on:/,/^permissions:/p' "$WORKFLOW" | grep -v '^ *#')"
  assert_not_contains "$ON_BLOCK" "paths-ignore" \
    "🚨 the on: trigger has NO paths-ignore (a filtered trigger + a required check = permanent pending)"
  assert_not_contains "$ON_BLOCK" "paths:" \
    "🚨 the on: trigger has NO inclusive paths filter either (the worse shape — it never reports for most PRs)"
  assert_contains "$ON_BLOCK" "pull_request" \
    "the workflow still triggers on pull_request"

  # 2. The workflow must actually call the classifier under test.
  assert_contains "$YML" "infra/ci/docs-only-paths.sh" \
    "the changes job invokes the classifier this suite tests"

  # 3. Both suites must run IN-BAND, inside the changes job, before the
  #    classification is trusted. A suite nobody runs proves nothing.
  assert_contains "$YML" "infra/ci/__tests__/docs-only-paths.test.sh" \
    "the changes job self-tests the classifier in-band"
  assert_contains "$YML" "infra/ci/__tests__/pre-merge-gate-decide.test.sh" \
    "the changes job self-tests the gate decision in-band"

  # 4. The expensive job must be gated on the NEGATIVE, so a classifier that
  #    emits nothing at all still runs the full build.
  assert_line "$YML" "^    if: needs\.changes\.outputs\.docs_only != 'true'$" \
    "next-build skips only on an explicit docs_only == true (anchored)"
  assert_not_contains "$YML" "if: needs.changes.outputs.docs_only == 'false'" \
    "next-build is NOT gated on == 'false' (an empty output would skip it)"

  # 5. 🚨 The build must stay HARD-gating, and the typecheck must stay AFTER
  #    it. A cold tsc on this repo reports 8 phantom errors because
  #    next-env.d.ts and .next/types/routes.d.ts are generated DURING
  #    `next build`; post-build the same tsc reports 0. Inverting the order
  #    would report a healthy repo as broken, and someone would then "fix" the
  #    gate by making the step soft-fail.
  BUILD_LINE="$(grep -n '^      - name: build (HARD GATE' "$WORKFLOW" | cut -d: -f1)"
  TSC_LINE="$(grep -n '^      - name: typecheck (HARD GATE' "$WORKFLOW" | cut -d: -f1)"
  if [ -n "$BUILD_LINE" ] && [ -n "$TSC_LINE" ] && [ "$BUILD_LINE" -lt "$TSC_LINE" ]; then
    ok "🚨 the typecheck step runs AFTER the build step (line ${BUILD_LINE} < ${TSC_LINE}) — a cold tsc reports 8 phantom errors on this repo"
  else
    bad "🚨 build/typecheck ordering is wrong or a step was renamed (build=${BUILD_LINE:-missing}, typecheck=${TSC_LINE:-missing}). A bare cold tsc reports 8 phantom errors here."
  fi

  # The whole next-build job, from its id to the gate job that follows it.
  BUILD_BLOCK="$(sed -n '/^  next-build:/,/^  pre-merge-gate:/p' "$WORKFLOW")"
  assert_not_contains "$BUILD_BLOCK" "continue-on-error" \
    "🚨 no step in next-build is soft-failed — install, build, typecheck and test all gate"

  # 6. 🚨 The install must be the one the DEPLOY runs. Dockerfile:31 is
  #    `RUN npm ci --legacy-peer-deps`; neither dev.yml nor main.yml installs
  #    anything itself (both `docker build .`). A gate that installs more
  #    permissively than the deploy cannot fail on a dependency conflict that
  #    breaks the deploy — SuperAdmin-Front#410.
  assert_contains "$BUILD_BLOCK" "npm ci --legacy-peer-deps" \
    "🚨 the gate installs with 'npm ci --legacy-peer-deps' — the Dockerfile's install, verbatim"
  DOCKERFILE="${REPO_ROOT}/Dockerfile"
  if [ -f "$DOCKERFILE" ]; then
    if grep -qE '^RUN npm ci --legacy-peer-deps$' "$DOCKERFILE"; then
      ok "🚨 the Dockerfile still installs with 'npm ci --legacy-peer-deps' — gate and deploy agree"
    else
      bad "🚨 the Dockerfile's install line changed. The gate now installs a DIFFERENT tree from the one that deploys — reconcile them or this gate is testing a fiction (SuperAdmin-Front#410)."
    fi
  else
    bad "Dockerfile not found — cannot prove the gate's install matches the deploy's"
  fi
fi

echo
echo "----"
echo "passed: ${PASS}"
echo "failed: ${FAIL}"

if [ "$PASS" -eq 0 ]; then
  echo "::error::docs-only-paths.test.sh asserted NOTHING — an empty pass is the failure mode this file exists to prevent."
  exit 1
fi

if [ "$FAIL" -ne 0 ]; then
  echo "::error::docs-only-paths.test.sh failed (${FAIL} assertion(s)). Do NOT merge: a wrong answer here either deadlocks the branch or silently un-gates it."
  exit 1
fi

echo "docs-only-paths.test.sh PASSED (${PASS} assertions)"
