<!--
  droplinked-shop-builder PR template.
  Mirrors the discipline established in droplinked-backend#1700:
  every PR addressing an existing ticket MUST use GitHub's auto-close
  syntax so the equilibrium board reflects ground truth.
  Sections marked REQUIRED can't be deleted — write "N/A" if they
  don't apply.
-->

## Summary

<!-- 1-3 sentences. What does this PR do and why? -->

## Closes / addresses

<!--
  REQUIRED. Use GitHub's auto-close syntax so the linked issue closes
  when this PR merges. Stale-open issue cleanup from 2026-06-08 found
  shipped PRs leaving tickets open indefinitely because they skipped
  this section.

    Closes #1234            - this PR fully resolves the issue
    Addresses #1234         - partial fix, issue stays open
    Refs #1234              - related work, no closure implied

  If purely net-new (no existing ticket), write: "N/A — net-new work".
-->

- Closes #
- Addresses #
- Refs #

## Reproduce (bug fixes) / Describe the new behavior (features)

<!--
  For bug fixes: paste the screenshot / repro steps that prove the bug
  exists on `main` before this PR. Sentry/Datadog issue id welcome.
  For features: describe the new behavior in plain English.
-->

## Root cause / approach

<!-- For bug fixes: where the bug lives + why. For features: high-level approach. -->

## Visual diff (UI-touching PRs)

<!--
  Before / after screenshots OR loom. Required when this PR touches a
  rendered surface. Skip if backend-only / non-rendering change.
-->

## Test plan

- [ ] `pnpm test` / `pnpm typecheck` / `pnpm lint` clean
- [ ] Manually verified on the affected route (paste URL)
- [ ] Tested edge cases mentioned in the issue (or "no edge cases applicable")

## DEV smoke plan (run after merge to dev, before LIVE promotion)

<!--
  After this PR merges to `dev`, the dev deploy fires. List the
  specific click path / browser steps that prove the change works on
  the dev shop-builder URL. The agent / operator runs these BEFORE
  the dev→main GTFU promote.
-->

## LIVE smoke plan (run after operator merges dev→main)

<!-- Same as DEV smoke but against the production shop-builder URL. -->

## Rollback target

<!--
  Required. If this PR ships and breaks prod, what's the rollback?
  Last-known-good commit SHA or revert PR.
-->

- Last-known-good main commit: `<sha>`
- Rollback: revert PR — `gh pr revert <this-pr-number>`

## Risk

<!-- Low / Medium / High and why. What could break? -->

## Out of scope (NOT in this PR)

<!--
  List follow-ups noted during this work. Linked tickets / PR numbers
  welcome. Helps the operator audit cleanup debt.
-->

---

## Operator merge checklist

<!-- Operator fills this in during/after merge. -->

- [ ] CI green
- [ ] Reviewed diff
- [ ] Merged to `main` via dev→main GTFU
- [ ] Smoked on prod shop-builder URL — green
- [ ] No regression; PR closed
