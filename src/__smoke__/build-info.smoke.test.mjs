/**
 * Build identity resolution — the rules `GET /api/health` depends on.
 *
 * This exercises THE REAL MODULE the route handler imports (`@/lib/build-info.mjs`),
 * not a copy of its rules. That is why the resolver is plain ESM: this repo's
 * `npm test` is Node's built-in runner with no TypeScript transform in front of
 * it, so a `.ts` resolver could only have been tested by duplicating its logic
 * here — and a duplicate drifts.
 *
 * The contract these tests defend is FAIL-SOFT. `/api/health` is meant to be
 * probed by CI, a canary, and eventually the load balancer; an exception on
 * that path is a production outage waiting to be adopted. The case that
 * matters most is the ABSENT one: no build arg must yield a sentinel and a
 * healthy response, never a throw.
 *
 * Runner: Node's built-in test runner (this repo has no jest/vitest).
 * Invoke directly:
 *   node --test src/__smoke__/build-info.smoke.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BUILD_INFO,
  BUILT_AT_ENV_KEYS,
  COMMIT_ENV_KEYS,
  SHORT_SHA_LENGTH,
  UNKNOWN_BUILD_FIELD,
  normalizeBuiltAt,
  normalizeCommit,
  resolveBuildInfo,
} from '../lib/build-info.mjs';

/** Full 40-char object name, the shape `github.sha` actually has. */
const FAKE_SHA = '01eb6e2ba1c4d5e6f708192a3b4c5d6e7f809123';

test('a full github.sha is abbreviated to a comparable short SHA', () => {
  assert.equal(normalizeCommit(FAKE_SHA), '01eb6e2ba');
  // A genuine prefix, so `curl … | jq -r .commit` compares directly against
  // `git rev-parse main | cut -c1-9`.
  assert.ok(FAKE_SHA.startsWith(normalizeCommit(FAKE_SHA)));
});

test('an uppercase SHA is lowercased so comparisons against git are stable', () => {
  assert.equal(normalizeCommit(FAKE_SHA.toUpperCase()), '01eb6e2ba');
});

test('an already-short SHA at the 7-char lower bound is accepted', () => {
  assert.equal(normalizeCommit('0abc123'), '0abc123');
});

test('anything that is not a git object name degrades to the sentinel', () => {
  for (const raw of [
    '', // absent
    'abc12', // too short
    'a'.repeat(41), // too long
    'refs/heads/main', // not hex
  ]) {
    assert.equal(normalizeCommit(raw), UNKNOWN_BUILD_FIELD, `input: ${JSON.stringify(raw)}`);
  }
});

test('hostile input is never echoed back to an anonymous caller, and never throws', () => {
  // /api/health is unauthenticated. Whatever ends up in the env, the endpoint
  // may only emit a value it has recognised as a commit.
  for (const raw of [
    '<script>alert(1)</script>',
    '$(whoami)',
    '../../etc/passwd',
    'abc\u0000def0123',
    '0abc123\r\nX-Injected: 1',
    ' '.repeat(4096),
    '{"commit":"0abc123"}',
  ]) {
    assert.doesNotThrow(() => normalizeCommit(raw));
    assert.equal(normalizeCommit(raw), UNKNOWN_BUILD_FIELD, `input: ${JSON.stringify(raw)}`);
  }
});

test("the workflow's `date -u` format normalises to ISO-8601", () => {
  assert.equal(normalizeBuiltAt('2026-09-02T15:54:11Z'), '2026-09-02T15:54:11.000Z');
});

test('an unparseable timestamp degrades to the sentinel', () => {
  for (const raw of ['', 'yesterday', '2026-13-45T99:99:99Z', '$(date)']) {
    assert.equal(normalizeBuiltAt(raw), UNKNOWN_BUILD_FIELD, `input: ${JSON.stringify(raw)}`);
  }
});

test('resolveBuildInfo reads the build args wired by the deploy workflow', () => {
  assert.deepEqual(
    { ...resolveBuildInfo({ BUILD_COMMIT_SHA: FAKE_SHA, BUILD_TIME: '2026-09-02T15:54:11Z' }) },
    { commit: '01eb6e2ba', builtAt: '2026-09-02T15:54:11.000Z' },
  );
});

test('THE FALLBACK: absent build args degrade to the sentinel, never to an error', () => {
  assert.doesNotThrow(() => resolveBuildInfo({}));
  assert.deepEqual({ ...resolveBuildInfo({}) }, {
    commit: UNKNOWN_BUILD_FIELD,
    builtAt: UNKNOWN_BUILD_FIELD,
  });
});

test('an EMPTY build arg is the same case as an absent one', () => {
  // `ENV FOO=${FOO}` with an empty `ARG` default sets the EMPTY STRING rather
  // than leaving the variable unset — that is what a local `docker build`
  // actually produces once the Dockerfile declares the ARGs.
  assert.deepEqual({ ...resolveBuildInfo({ BUILD_COMMIT_SHA: '', BUILD_TIME: '' }) }, {
    commit: UNKNOWN_BUILD_FIELD,
    builtAt: UNKNOWN_BUILD_FIELD,
  });
  assert.deepEqual({ ...resolveBuildInfo({ BUILD_COMMIT_SHA: '   ', BUILD_TIME: '\t\n' }) }, {
    commit: UNKNOWN_BUILD_FIELD,
    builtAt: UNKNOWN_BUILD_FIELD,
  });
});

test('the two fields degrade independently', () => {
  const info = resolveBuildInfo({ BUILD_COMMIT_SHA: FAKE_SHA, BUILD_TIME: 'not-a-date' });
  assert.equal(info.commit, '01eb6e2ba');
  assert.equal(info.builtAt, UNKNOWN_BUILD_FIELD);
});

test('resolveBuildInfo is synchronous, total, and returns a frozen object', () => {
  const info = resolveBuildInfo({});
  assert.equal(typeof info.then, 'undefined', 'no promise on the health path');
  assert.ok(Object.isFrozen(info), 'no caller can mutate the reported build');
  assert.doesNotThrow(() =>
    resolveBuildInfo({
      BUILD_COMMIT_SHA: '\u0000\uffff '.repeat(512),
      BUILD_TIME: ' '.repeat(512),
    }),
  );
});

test('BUILD_INFO is resolved at module load and is always two strings', () => {
  // In this test process there is no build arg, so this is also the live
  // proof that `next dev` / a local build report the sentinel rather than
  // crashing the route module.
  assert.equal(typeof BUILD_INFO.commit, 'string');
  assert.equal(typeof BUILD_INFO.builtAt, 'string');
  assert.equal(BUILD_INFO.commit, UNKNOWN_BUILD_FIELD);
  assert.equal(BUILD_INFO.builtAt, UNKNOWN_BUILD_FIELD);
});

test('the source of truth is the image, not AWS and not the deploy-written .env', () => {
  // Structural, not stylistic. This fails if a future edit reaches for the ECS
  // task definition (which reports the LATEST REGISTERED revision, not the
  // RUNNING one — the 2026-09-02 conflation) or for `SENTRY_RELEASE`, which the
  // deploy already writes with the same github.sha but only into the `.env`
  // consumed by the BUILDER stage. The runner stage never sees it.
  assert.deepEqual([...COMMIT_ENV_KEYS], ['BUILD_COMMIT_SHA']);
  assert.deepEqual([...BUILT_AT_ENV_KEYS], ['BUILD_TIME']);
  assert.equal(SHORT_SHA_LENGTH, 9, 'matches apiv3 /health and mcp /healthz');
});
