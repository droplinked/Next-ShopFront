# Mobile Regression Testing Framework

Framework-agnostic playbook for catching mobile-only regressions before
production. Tuned for SPAs, MPAs, and JS-heavy sites where bugs surface
differently on iOS Safari, Android Chrome, and tablets than they do on
desktop.

## Why this exists

Mobile-only regressions are the most expensive class of bug:
1. They survive desktop-only testing
2. They surface late, often days after merge
3. They affect the highest-intent users (mobile = active engagement)
4. They compound — one broken interaction kills the conversion funnel

This framework codifies the patterns that catch them BEFORE production.

---

## Core principles

1. **Real-device emulation, not desktop-shrunk-viewports.** iOS Safari has
   unique behaviors (suspended JS on tab blur, viewport recalculation on
   scroll, third-party cookie blocking, autoplay restrictions) that no
   amount of Chrome DevTools "responsive mode" reproduces. Use Playwright's
   device profiles or a real-device cloud.

2. **Test the bug-shaped paths.** Every mobile bug you've shipped becomes
   a regression test. Maintain a `BUGS_TO_NEVER_REGRESS.md` and require a
   test entry for each historical fix.

3. **Speed gates merges; thoroughness gates releases.** Two-tier suite:
   - Smoke (<60s) on every PR; blocks merge
   - Full (5-15min) nightly on production; alerts but doesn't block

4. **Deterministic or quarantined.** Flaky tests destroy trust faster than
   they catch bugs. A test that flakes 3× in a week gets `.skip` with a
   TODO. Zero tolerance for `sleep(N)` waits.

5. **Stable selectors only.** `data-testid` is a contract; CSS classes are
   an implementation detail. Don't couple tests to styling.

6. **Visual regression as last-line defense.** Screenshot diffs catch
   layout breaks no semantic assertion would. Threshold at 2% pixel diff;
   require human approval for baseline updates.

---

## Device + browser matrix

Minimum viable matrix (~95% mobile coverage):

| Profile                       | Why                                                                          |
|-------------------------------|------------------------------------------------------------------------------|
| **iPhone 14**                 | Modern iOS Safari, default                                                   |
| **iPhone SE (3rd gen)**       | Smallest modern iOS viewport — catches cramped text and CTAs                 |
| **iPhone 14 Pro Max**         | Largest iOS viewport — catches "centered content drifts"                     |
| **Pixel 7**                   | Modern Android Chrome — often diverges from iOS on Web APIs                  |
| **iPad Pro 11"**              | Tablet — common regression source                                            |

Optional tier-2 (high-stakes flows):

| Profile                       | Why                                            |
|-------------------------------|------------------------------------------------|
| **Samsung Galaxy S22**        | Samsung Internet browser quirks                |
| **iPhone 11**                 | Older iOS — still ~15% of iOS users            |
| **Android Tablet**            | Catches "we tested iPad" assumptions           |

Full matrix nightly; iPhone 14 + Pixel 7 on every PR.

---

## Test category taxonomy

Organize tests into categories so coverage gaps are obvious. Each
category gets its own `.spec.ts`:

### 1. Smoke
- Page loads without JS errors
- Critical paths return 200 + render <3s on slow 3G
- No console errors in first 5s
- Goal: catch deploy disasters in <60s

### 2. Audio / video playback
- Play/pause synchronous (no stuck loading)
- Media Session API metadata populated
- Audio resumes after visibility-change → blur → return
- Bluetooth-headset / AirPods hardware key handling
- Goal: catch "audio dies on iOS" class

### 3. Payment / wallet flows
- Stripe / PayPal / Apple Pay buttons render above iOS bottom bar
- Wallet modals (WalletConnect, Coinbase, MetaMask) don't clip
- Return-trip from external wallet app preserves state
- **DO NOT test real transactions** — mock the provider; assert UI intent
- Goal: catch revenue-blocking regressions

### 4. CSP / security headers
- No CSP violations on critical pages
- Cookies `SameSite=Strict` + `Secure` where intended
- No mixed-content warnings
- Goal: prevent CSP misconfig from breaking pages silently

### 5. Service Worker / PWA
- SW registers on first visit
- Offline state shows correct banner
- Install prompt renders on Android, hidden on iOS
- Goal: catch SW + caching regressions

### 6. Bottom-nav / safe-area ergonomics
- No critical UI hides under iOS Safari's bottom bar
- `env(safe-area-inset-bottom)` respected on notched devices
- Modals don't trap users (close reachable)
- Goal: catch iPhone-specific layout breaks

### 7. Visual regression
- Screenshot per (route × device) on first-paint
- `maxDiffPixelRatio: 0.02`
- Baselines committed; updates require review
- Goal: catch unintended visual breaks

### 8. Performance budget (optional)
- First Load JS per route under N KiB
- LCP <2.5s on slow 3G
- Goal: prevent perf regressions

---

## Architecture standards

### Selector contract

```ts
// ✅ Good — stable, refactor-proof
await page.locator('[data-testid="play-button"]').click();

// ❌ Bad — couples test to styling
await page.locator('.btn-primary.large').click();

// ❌ Bad — fragile to copy changes
await page.getByRole('button', { name: 'Play now' }).click();
```

### State setup

Don't authenticate via UI flow. Set state directly:

```ts
await page.addInitScript(() => {
  localStorage.setItem('app:session', JSON.stringify({ token: 'test-...' }));
});
```

For wallets, mock the provider — see `helpers/wallet-mock.ts`.

### Network isolation

Mock external services. Never hit real APIs:

```ts
await page.route('https://api.stripe.com/**', async (route) => {
  await route.fulfill({ status: 200, body: JSON.stringify(MOCK) });
});
```

### Determinism

```ts
// ✅ Wait for the thing
await page.waitForResponse((r) => r.url().includes('/api/article'));
await page.waitForLoadState('networkidle');

// ❌ Sleep
await page.waitForTimeout(2000);
```

If a test needs `waitForTimeout`, the underlying behavior is racy. Fix the
race, not the test.

---

## Anti-patterns to refuse

| Anti-pattern                          | Why it's wrong                            | Do instead                                       |
|---------------------------------------|-------------------------------------------|--------------------------------------------------|
| `waitForTimeout(N)`                   | Race conditions disguised                 | `waitForSelector` / `waitForResponse`            |
| CSS class selectors                   | Brittle to refactors                      | `data-testid`                                    |
| Real-API calls                        | Slow, non-deterministic, costs money      | Mock with `page.route`                           |
| Real authentication                   | Slow, leaks creds                         | Inject session into localStorage via `addInitScript` |
| Real transactions                     | Irreversible, costly                      | Mock wallet provider; assert UI intent           |
| One giant test                        | Failure tells you nothing                 | One test per behavior                            |
| Disabled flaky tests left to rot      | Tests bitrot; coverage silently degrades  | Quarantine with TODO + 2-week kill date          |
| Skipping mobile because "desktop covers it" | Desktop ≠ mobile                    | Two separate suites                              |
| Testing implementation, not behavior  | Tests break on refactor                   | Test what the user sees / does                   |
| No visual regression                  | Layout breaks ship                        | Screenshot diffs with low threshold              |
| Treating `begin_nested() + flush()` as durable | SAVEPOINTs only protect within the outer txn; if the outer rolls back, the row vanishes — but the side effect (alert sent, webhook fired, email delivered) already happened. Test catches this with: assert state survives outer-txn rollback. | For idempotency/dedup writes that gate side effects, commit in an INDEPENDENT session. Test it by deliberately rolling back the caller's txn after the write and verifying the dedup row still exists. |

---

## Success metrics

A project has successfully adopted the framework when:
1. Every merged PR that touches user-facing code runs smoke against a
   preview deploy and blocks on failure
2. Every mobile-only bug since adoption has a regression test
3. No `sleep` / `waitForTimeout` exists in the suite
4. Quarantined test count stays under 5% of total
5. Time-to-detect a mobile regression dropped from "days after deploy" to
   "before merge"

---

## Customization guide

When applying to a specific project:

| Section                  | Customization                                                              |
|--------------------------|----------------------------------------------------------------------------|
| Device matrix            | Cut/add based on actual user analytics                                     |
| Test categories          | Drop categories that don't apply (no payments? drop §3)                    |
| Smoke suite size         | Target <60s wall-clock on CI                                               |
| Selector strategy        | If codebase uses `aria-label` consistently, fold that into the contract    |
| Mock library             | Use `msw` if already present; otherwise Playwright's `page.route`          |
| CI provider              | Translate workflow YAML to GitLab CI / CircleCI / Buildkite                |
| Visual regression hosting| Percy / Chromatic / Argos if budget allows; otherwise local baselines      |
