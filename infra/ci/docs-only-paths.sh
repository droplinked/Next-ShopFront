#!/usr/bin/env bash
# Classify a PR's changed-file set as "docs-only" or not.
#
# ---------------------------------------------------------------------------
# WHY THIS FILE EXISTS
# ---------------------------------------------------------------------------
# Next-ShopFront serves shop.droplinked.com — all 23,025 product URLs in the
# public ACP feed, server-rendered. Until `pre-merge-checks.yml` landed, NO
# `pull_request` check in this repo ran `next build`, compiled a line of
# TypeScript, or executed a test. Branch protection on `main` required only
# `enforce-source-branch`, which validates the branch NAME. A PR that broke the
# build merged green and the failure surfaced at deploy.
#
# The obvious way to make the new gate cheap on docs PRs is a `paths-ignore:`
# on the trigger. That is a TRAP, and it is the reason this file exists rather
# than a one-line filter:
#
#   A workflow-level path filter and a required status check are incompatible.
#   When the filter matches, the workflow never STARTS — so GitHub never
#   reports that context at all, and a required check that never arrived is
#   treated as PENDING, not failed. It is not a red check the author can fix;
#   it is an ABSENT one, which is worse, because nothing on the page explains
#   it. A docs-only PR would sit unmergeable forever: no re-run to trigger, no
#   failing job to fix, no empty commit that helps.
#
# An inclusive `paths:` filter is strictly worse again: it never reports for
# the MAJORITY of PRs rather than a minority of them.
#
# So the docs filter lives HERE, in the workflow body: `pre-merge-checks.yml`
# always starts on a PR, this script decides whether the expensive job is
# needed, and `pre-merge-gate` always reports a conclusion.
#
# ---------------------------------------------------------------------------
# 🚨 THE FAILURE MODE THIS SCRIPT MUST NEVER HAVE
# ---------------------------------------------------------------------------
# Returning `true` for a change set containing ANY non-docs file would let
# `pre-merge-gate` report green while `next build` never ran — silently
# disabling the only real gate this repo has. That is strictly WORSE than the
# deadlock it replaces, because a deadlock is visible and an ungated branch is
# not.
#
# Two properties make that structurally hard:
#
#   1. The answer is AND over every path, not OR. The loop exits `false` on the
#      first non-docs path. There is no path list, ordering or count that can
#      make a code PR docs-only.
#   2. Every rule is an ALLOW-list of the exact patterns the deploy workflows'
#      own `paths-ignore` blocks hold (dev.yml:6-10, main.yml:6-10), plus the
#      GitHub template directories. An unrecognised path falls through to "not
#      docs" BY CONSTRUCTION, so a new directory, a new file type or a typo
#      fails CLOSED (runs the build) rather than open.
#
# An empty change set is NOT docs-only. A gate that asserted nothing must not
# be green.
#
# Deliberate NON-matches, each covered by an assertion in
# `infra/ci/__tests__/docs-only-paths.test.sh`:
#   .github/workflows/*.yml   — a CI change MUST run CI
#   infra/ci/**               — this classifier and the gate decision itself
#   src/**, helpers/**, tests/**, public/**
#   Dockerfile                — it IS the deploy's build recipe
#   next.config.mjs, tsconfig.json, package.json, package-lock.json
#   index.d.ts                — ambient types, in the tsconfig `include`
#   LICENSE.txt, src/vendor/LICENSE   — 'LICENSE' is root-anchored
#   src/.gitignore                    — likewise
#   documentation/, docs-x/           — 'docs/' is a directory, not a prefix
#   .github/ISSUE_TEMPLATE_x/         — likewise
#
# Usage:
#   bash infra/ci/docs-only-paths.sh <path> [<path> ...]   # prints true|false
#
# Exit code: 0 on a successful classification. The caller must run under
# `set -e` so ANY error here fails the job rather than being read as "not
# docs" or, worse, as an empty string.

set -euo pipefail

# Is a single path inside the docs allow-list?
#   0 = ignorable (docs), 1 = must run the build.
is_docs_path() {
  case "$1" in
    # '**.md' — any Markdown file at any depth. Covers README.md,
    # CONTRIBUTING.md, SECURITY.md, BUGS_TO_NEVER_REGRESS.md, docs/*.md and
    # .github/PULL_REQUEST_TEMPLATE.md.
    *.md) return 0 ;;
    # 'docs/**' — the top-level documentation directory (docs/framework.md,
    # docs/adoption-checklist.md today).
    docs/*) return 0 ;;
    # Exact, root-anchored literals. GitHub anchors a bare 'LICENSE' /
    # '.gitignore' entry at the repository root, and so does this.
    LICENSE) return 0 ;;
    .gitignore) return 0 ;;
    # '.github/ISSUE_TEMPLATE/**' — no such directory today; listed so adding
    # one later does not start forcing a full build on template edits.
    .github/ISSUE_TEMPLATE/*) return 0 ;;
    *) return 1 ;;
  esac
}

# No arguments = no changed files. Not docs-only: see the empty-set note above.
if [ "$#" -eq 0 ]; then
  echo false
  exit 0
fi

for path in "$@"; do
  # An empty path is not something this script can reason about; fail closed.
  if [ -z "$path" ]; then
    echo false
    exit 0
  fi
  if ! is_docs_path "$path"; then
    echo false
    exit 0
  fi
done

echo true
