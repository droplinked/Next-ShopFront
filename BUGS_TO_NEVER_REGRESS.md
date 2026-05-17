# Bugs to Never Regress

Every mobile-only bug, once fixed, gets a row here AND a regression test in
`tests/`. The test must fail BEFORE the fix and pass AFTER.

This file is enforced in PR review: "did you add a bug row + test?" If no,
the bug will return.

## Template

```
| Date       | Device      | Symptom                              | Fix PR | Test file                              |
|------------|-------------|--------------------------------------|--------|----------------------------------------|
| YYYY-MM-DD | iPhone 14   | <user-visible symptom in 1 line>     | #123   | tests/audio-playback.spec.ts::testname |
```

## Active log

| Date       | Device      | Symptom                                                              | Fix PR | Test file                                          |
|------------|-------------|----------------------------------------------------------------------|--------|----------------------------------------------------|
| YYYY-MM-DD | iPhone 14   | MiniPlayer rendered on top of full player on `/story/*`              | #72    | tests/audio-playback.spec.ts::mini-player-suppress |
| YYYY-MM-DD | iPhone 14   | Wallet didn't reconnect after returning from external wallet app     | #74    | tests/payment-flow.spec.ts::wallet-return-trip     |
| YYYY-MM-DD | iPhone SE   | Apple Pay button clipped under iOS Safari bottom address bar         | TBD    | tests/bottom-nav-ergonomics.spec.ts::apple-pay-z   |
| YYYY-MM-DD | Pixel 7     | Service worker failed to register on first visit                     | TBD    | tests/smoke.spec.ts::service-worker-registers      |
| YYYY-MM-DD | iPad Pro    | Layout assumed phone-or-desktop; tablet got wrong nav                | TBD    | tests/visual-regression.spec.ts::ipad-nav          |
```

## Rules

1. **One row per bug, even if related.** Don't fold three bugs into one row.
2. **Test name must match the row.** Grep-ability matters — when the test
   fails in 6 months, the row tells you the original context.
3. **Don't delete rows.** If a test is removed (e.g. feature deprecated),
   strike through the row but keep the history.
4. **Periodic audit.** Quarterly, scan the log + verify every test still
   runs and still tests its bug.

## Historical seed (mined from git history 2026-05-17)

**History shallow — no qualifying entries seeded.** This repo is a young
Next.js shopfront fork; the visible `git log` contains only CI / dependency
/ infra commits (Next.js bump #3, SKALE drop #11, OIDC migration #4, CVE
overrides #5/#8/#9, auto-changelog #13, CI cost-reduction #14). No
`fix:`-style commits touching mobile, iOS Safari, Android, viewport,
safe-area, scroll, modal, drawer, sticky, or responsive surfaces exist
yet.

The first real mobile bug fix on this repo should be appended here as the
first row, alongside its regression spec in `tests/`.
