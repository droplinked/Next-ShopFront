# Adoption Checklist

Ordered steps to onboard a project to the mobile-testing-starter
framework. Treat each item as a gate — don't skip ahead until the prior
step is satisfied.

## Phase 1 — Scaffolding (Day 1, <2 hours)

- [ ] **Decide where to nest the suite**:
      - If the project has NO existing `playwright.config.ts` at the
        repo root: copy starter files to the repo root.
      - If the project HAS a root `playwright.config.ts` (e.g. for desktop
        e2e or Storybook): nest the mobile suite at `tests/mobile/` to
        avoid colliding with the existing config. The starter's
        `playwright.config.ts` should be moved to `tests/mobile/`, and
        its `testDir` adjusted to `./` (relative to its own location).
        npm scripts then point to the nested config:
        `playwright test --config=tests/mobile/playwright.config.ts`.

- [ ] **Copy starter files into the project**:
      ```bash
      # Flat layout (no existing config)
      cp -R ~/Desktop/mobile-testing-starter/{tests,helpers,playwright.config.ts,tsconfig.json,BUGS_TO_NEVER_REGRESS.md,docs} <your-project>/
      cp ~/Desktop/mobile-testing-starter/.github/workflows/mobile-test.yml <your-project>/.github/workflows/

      # Nested layout (existing config — recommended for most multi-suite repos)
      mkdir -p <your-project>/tests/mobile
      cp -R ~/Desktop/mobile-testing-starter/{tests,helpers,playwright.config.ts,BUGS_TO_NEVER_REGRESS.md,docs} <your-project>/tests/mobile/
      mv <your-project>/tests/mobile/tests/* <your-project>/tests/mobile/ && rmdir <your-project>/tests/mobile/tests
      cp ~/Desktop/mobile-testing-starter/.github/workflows/mobile-test.yml <your-project>/.github/workflows/
      ```

- [ ] **Install Playwright** (if not already a dep):
      ```bash
      npm install -D @playwright/test
      npx playwright install --with-deps chromium webkit
      ```

- [ ] **Merge npm scripts** from starter `package.json` into project
      `package.json`. If the project has existing `test:e2e` or
      `test:playwright` scripts, namespace yours as `test:mobile:*` to
      avoid collision. Adjust `--config=` flag if nested.

- [ ] **Customize `playwright.config.ts`**:
      - `baseURL`: point at preview deploy or production
      - `testDir`: matches your chosen layout (flat or nested)
      - Device matrix: cut to what your analytics actually shows
      - If nested AND a root config exists, add a `testIgnore: ['tests/mobile/**']`
        to the root config so the root runner doesn't double-execute these
        files.

- [ ] **Customize `helpers/session.ts`**:
      - Replace `app:session` (the default `storageKey` param) with your
        project's actual localStorage session key
      - Update `DEFAULT_TEST_SESSION` shape to match what your app reads

- [ ] **Customize `helpers/network.ts`**:
      - Add `custom` mocks for your project's specific external APIs
      - If your app uses Web3, ALSO add `helpers/web3-network.ts` from the
        starter and call `mockWeb3Network(page)` alongside `mockExternalServices(page)`

- [ ] **Update `tests/smoke.spec.ts`**: replace `EXAMPLE_PATHS` with your
      app's actual critical routes (start with 3-4 — `/`, primary content
      route, conversion route)

- [ ] **Run smoke locally**: `npm run test:mobile:smoke` against your dev
      server or staging. Confirm tests EXECUTE (most will fail on missing
      testids; that's expected at this stage)

## Phase 2 — Generate visual regression baselines (Day 1, ~10 min)

- [ ] **Customize `tests/visual-regression.spec.ts`**: set `ROUTES` to your
      critical paths
- [ ] **Run baseline generation against a STABLE deploy** (production,
      not localhost — local renders too inconsistently):
      ```bash
      PLAYWRIGHT_BASE_URL=https://your-prod-url npm run test:mobile:update-snapshots
      ```
- [ ] **Inspect the generated baselines** under `tests/mobile/__screenshots__/`
      — open each PNG, verify rendering matches expected production state
- [ ] **Commit baselines** with a descriptive PR title: `test(mobile):
      baseline visual regression for {device profiles}`. These become the
      contract — every future test run diffs against them.

## Phase 3 — Testid audit (Day 1-2)

- [ ] **Run audio playback test**: identify missing testids. Note them down.
- [ ] **Run payment flow test**: identify missing testids.
- [ ] **Add testids in a SEPARATE PR** titled `test(mobile): backfill
      data-testid on critical-path components`. Don't couple scaffold with
      component changes — review pain.
- [ ] **Standard testid coverage**: every interactive element + every
      assertable region. Audit checklist:
      - Audio player: `audio-player`, `play-button`, `pause-button`,
        `mini-player`, `seek-bar`, `time-display`
      - Payment: `tip-button`, `wallet-modal`, `wallet-modal-close`,
        `wallet-connected-chip`, `tier-cta-{plus,pro,enterprise}`
      - Auth: `signin-button`, `signup-button`, `account-menu`
      - Navigation: `mobile-menu-toggle`, `back-button`

## Phase 4 — Customize categories (Week 1)

- [ ] **Drop categories that don't apply** (no payments → delete
      `payment-flow.spec.ts`; no audio → delete `audio-playback.spec.ts`)
- [ ] **Add project-specific categories** if needed (streaming →
      `streaming-playback.spec.ts`; commerce → `cart-checkout.spec.ts`)
- [ ] **Tighten `CSP_ALLOW`** in `csp-compliance.spec.ts` so legitimate
      violations don't get suppressed. Useful starting allowlist for prod
      noise: nothing; tighten as you discover false positives.
- [ ] **Configure `ROUTES_WITH_BOTTOM_ANCHORED_UI`** in
      `bottom-nav-ergonomics.spec.ts` with your sticky-bottom elements
- [ ] **Set perf budgets** if applicable (LCP, First Load JS) — add an
      optional `performance.spec.ts`

## Phase 5 — CI integration (Week 1)

- [ ] **Customize `.github/workflows/mobile-test.yml`**:
      - Update the preview-URL extraction step to match your deploy
        target (Vercel, Netlify, Cloudflare Pages)
      - Set `secrets.PRODUCTION_URL` to your prod URL
      - Adjust `paths:` trigger glob to your repo layout
- [ ] **Verify PR run**: open a draft PR; confirm smoke job runs against
      preview URL
- [ ] **Enable required status check** (operator manual step in repo
      settings → branch protection): add "Smoke (PR gate)" as required
- [ ] **Set up BrowserStack / Sauce / LambdaTest** for nightly real-device
      runs (optional, costs money — start without it)

## Phase 6 — BUGS_TO_NEVER_REGRESS adoption (ongoing)

- [ ] **Audit recent mobile bug history**: scan git log + PR titles for
      the past 30-90 days, identify mobile-only bug fixes
- [ ] **Backfill rows** in `BUGS_TO_NEVER_REGRESS.md` for each, with bug
      description + fix PR + a TODO for the regression test
- [ ] **Write the backfill tests** — at least the 5-10 most painful
      historical bugs
- [ ] **Enforce in PR review**: every mobile bug fix PR template must
      include a checkbox "Added row to BUGS_TO_NEVER_REGRESS.md +
      regression test"
- [ ] **Quarterly audit**: prune quarantined tests; refresh device matrix
      against actual user analytics

## Phase 7 — Maturity (Month 2+)

- [ ] **Track time-to-detect**: instrument a metric for "how long after a
      mobile bug merged did the test catch it"; aim for "before merge"
- [ ] **Visual regression review queue**: baseline updates should appear
      in PR with clear before/after; reviewers must approve
- [ ] **Performance baselines**: lock First Load JS per route; alert on
      >5% regression
- [ ] **Cross-team adoption**: if multiple frontend repos, copy starter
      into each. Framework is repo-agnostic.
- [ ] **Iterate the framework itself**: as you find gaps, update the
      starter AND back-port improvements to projects that already adopted

---

## Common pitfalls during adoption

- **Skipping the testid audit**: tests will be brittle from day 1. Pay
  the cost upfront.
- **Allowing `waitForTimeout` "just to get started"**: it never gets
  fixed. Reject in code review.
- **Over-mocking**: if you mock everything, tests stop reflecting
  reality. Mock external services + sensitive operations; let internal
  navigation hit real handlers.
- **Visual regression baselines drifting silently**: enforce that
  baseline updates need a human approver, ideally a designer.
- **No required status check**: without it, devs will merge red and the
  suite becomes decorative.
- **Generating baselines from localhost**: font rendering, image loading,
  and async hydration vary between local and prod. Always baseline from
  production or a stable preview deploy.
- **Coupling scaffold and testid PRs**: makes review painful. Always
  ship the framework scaffold first, then a separate PR adds testids
  across components.
