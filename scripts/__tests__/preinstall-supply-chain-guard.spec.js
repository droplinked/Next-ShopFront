/* eslint-disable */
'use strict';

// Tests can run two ways:
//   1) `node --test scripts/__tests__/preinstall-supply-chain-guard.spec.js`
//      (matches the repo's existing `npm test` runner)
//   2) `npx jest scripts/__tests__/preinstall-supply-chain-guard.spec.js`
//      (only if jest is wired up at some later point)
//
// To stay runner-agnostic we use plain assertions + a tiny shim that
// recognises either `node:test`'s `test()` or a globally-injected
// jest `test()` / `describe()` pair.
//
// TWO LAYERS, deliberately:
//
//   * `scanLockfile` unit tests feed lockfile-shaped objects to the exported
//     function. Fast, precise — and by themselves they prove nothing about
//     whether npm ever reaches that function.
//   * the `production path` suite executes the command `npm ci` actually
//     runs, read out of package.json's `scripts.preinstall`, as a child
//     process, and asserts the EXIT CODE and the STDERR an engineer would
//     see. That is the layer that would catch a broken lockfile path, a crash
//     in main(), a guard that never exits non-zero, or a package.json that
//     stopped pointing at this script at all.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

let test;
let describe;
try {
  // node:test path (Node 18+).
  const nodeTest = require('node:test');
  test = nodeTest.test;
  describe = nodeTest.describe || ((_label, fn) => fn());
} catch (_err) {
  // Jest path.
  test = global.test;
  describe = global.describe;
}

const {
  scanLockfile,
  parseVersion,
  compareVersions,
  matchesRange,
} = require('../preinstall-supply-chain-guard');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GUARD_ABS = path.resolve(__dirname, '..', 'preinstall-supply-chain-guard.js');

// The one string that decides whether any of this runs in real life.
const PREINSTALL_COMMAND = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')
).scripts.preinstall;

// The script path npm will execute, taken from that command rather than
// hard-coded here — so renaming the file without updating package.json fails
// a test instead of silently disarming the guard.
const GUARD_REL = (/(\S+\.js)(\s|$)/.exec(PREINSTALL_COMMAND) || [])[1];

/** Run the real preinstall command with `root` as the project root. */
function runGuardIn(root) {
  return spawnSync(PREINSTALL_COMMAND, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
  });
}

/**
 * A throwaway project root holding a byte-for-byte copy of the guard at the
 * same relative path package.json declares, plus whatever lockfile the test
 * wants. Running PREINSTALL_COMMAND there exercises main() end to end —
 * lockfile resolution, JSON parse, scan, stderr, process exit code.
 */
function withGuardRoot(lockfileContent, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'supply-chain-guard-'));
  try {
    const dest = path.join(root, GUARD_REL);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(GUARD_ABS, dest);
    if (lockfileContent !== null) {
      fs.writeFileSync(path.join(root, 'package-lock.json'), lockfileContent);
    }
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const lockWith = (entries) =>
  JSON.stringify({
    name: 'fixture',
    lockfileVersion: 3,
    packages: Object.assign({ '': { name: 'fixture', version: '0.0.0' } }, entries),
  });

describe('preinstall-supply-chain-guard scanLockfile', () => {
  test('clean lockfile passes with no blocks', () => {
    const lock = {
      packages: {
        '': { name: 'next-shopfront', version: '0.1.0' },
        'node_modules/lodash': { name: 'lodash', version: '4.17.21' },
        'node_modules/next': { name: 'next', version: '15.5.18' },
        'node_modules/@droplinked_inc/web3': {
          name: '@droplinked_inc/web3',
          version: '1.0.0',
        },
      },
    };
    assert.deepEqual(scanLockfile(lock), []);
  });

  test('allows lodash 4.17.x and 4.18.x (vetted) but blocks 4.18.2+ / 4.19.x / 5.x', () => {
    const allowed = {
      packages: {
        'node_modules/lodash-old': { name: 'lodash', version: '4.17.21' },
        'node_modules/lodash-vetted-min': { name: 'lodash', version: '4.18.0' },
        'node_modules/lodash-vetted-max': { name: 'lodash', version: '4.18.1' },
      },
    };
    assert.deepEqual(scanLockfile(allowed), []);

    const blocked = {
      packages: {
        'node_modules/lodash-patch-bump': { name: 'lodash', version: '4.18.2' },
        'node_modules/lodash-minor-bump': { name: 'lodash', version: '4.19.0' },
        'node_modules/lodash-major-bump': { name: 'lodash', version: '5.0.0' },
      },
    };
    const blocks = scanLockfile(blocked);
    assert.equal(blocks.length, 3);
    for (const b of blocks) {
      assert.match(b.reason, /OpenJS-reboot-vetted 4\.18\.1 ceiling/);
    }
  });

  test('stream-json: allows 1.x (installed today) AND 3.5.0+ (the patched line)', () => {
    // 1.x is vulnerable per GHSA-528h-pc64-c93x and stays open as Dependabot
    // alert #176 — blocking it would fail every install and close nothing.
    // 3.5.0+ is the PATCH: if the guard blocked it, the bump that finally
    // closes #176 could not land as a lockfile change.
    const allowed = {
      packages: {
        'node_modules/stream-json': { name: 'stream-json', version: '1.9.1' },
        'node_modules/x/node_modules/stream-json': {
          name: 'stream-json',
          version: '1.8.0',
        },
        'node_modules/y/node_modules/stream-json': {
          name: 'stream-json',
          version: '3.5.0',
        },
        'node_modules/z/node_modules/stream-json': {
          name: 'stream-json',
          version: '3.6.0',
        },
        'node_modules/w/node_modules/stream-json': {
          name: 'stream-json',
          version: '4.0.0',
        },
      },
    };
    assert.deepEqual(scanLockfile(allowed), []);
  });

  test('stream-json: blocks the still-vulnerable 2.0.0-3.4.0 band, bare majors included', () => {
    const blocked = {
      packages: {
        'node_modules/sj-2-floor': { name: 'stream-json', version: '2.0.0' },
        'node_modules/sj-2-mid': { name: 'stream-json', version: '2.1.0' },
        'node_modules/sj-3-zero': { name: 'stream-json', version: '3.0.0' },
        'node_modules/sj-3-ceiling': { name: 'stream-json', version: '3.4.0' },
        // A bare major. npm does not write these, but the previous
        // /^(\d+)\./ test required a dot and let this through unexamined.
        'node_modules/sj-bare-major': { name: 'stream-json', version: '3' },
      },
    };
    const blocks = scanLockfile(blocked);
    assert.equal(blocks.length, 5);
    for (const b of blocks) {
      assert.match(b.reason, /GHSA-528h-pc64-c93x/);
    }

    // The band's bounds are the advisory's own, not a rounded major: the
    // upper bound is literally `<= 3.4.0` and the first patched release is
    // 3.5.0, so those two adjacent versions must land on opposite sides.
    assert.equal(
      scanLockfile({ packages: { 'node_modules/a': { name: 'stream-json', version: '3.4.0' } } }).length,
      1
    );
    assert.deepEqual(
      scanLockfile({ packages: { 'node_modules/a': { name: 'stream-json', version: '3.5.0' } } }),
      []
    );
    // Lower bound: 1.x sits below the band and stays installable.
    assert.deepEqual(
      scanLockfile({ packages: { 'node_modules/a': { name: 'stream-json', version: '1.9.1' } } }),
      []
    );
  });

  test('blocks bare droplinked-* names (squatters)', () => {
    const lock = {
      packages: {
        'node_modules/droplinked-sdk': {
          name: 'droplinked-sdk',
          version: '0.1.0',
        },
        'node_modules/droplinked-utils': {
          name: 'droplinked-utils',
          version: '9.9.9',
        },
      },
    };
    const blocks = scanLockfile(lock);
    assert.equal(blocks.length, 2);
    assert.deepEqual(
      blocks.map((b) => b.name).sort(),
      ['droplinked-sdk', 'droplinked-utils']
    );
    for (const b of blocks) {
      assert.match(b.reason, /@droplinked_inc/);
    }
  });

  test('does NOT block scoped @droplinked_inc/* packages', () => {
    const lock = {
      packages: {
        'node_modules/@droplinked_inc/sdk': {
          name: '@droplinked_inc/sdk',
          version: '1.0.0',
        },
        'node_modules/@droplinked_inc/web3': {
          name: '@droplinked_inc/web3',
          version: '2.3.4',
        },
      },
    };
    assert.deepEqual(scanLockfile(lock), []);
  });

  test('blocks fs@0.0.1-security typo-squat', () => {
    const lock = {
      packages: {
        'node_modules/fs': { name: 'fs', version: '0.0.1-security' },
      },
    };
    const blocks = scanLockfile(lock);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].name, 'fs');
    assert.match(blocks[0].reason, /typo-squat/);
  });

  test('npm v6 dependencies tree shape is also scanned', () => {
    const lock = {
      dependencies: {
        lodash: { version: '4.18.1' },
        next: {
          version: '15.5.18',
          dependencies: {
            'droplinked-evil': { version: '1.0.0' },
          },
        },
      },
    };
    const blocks = scanLockfile(lock);
    const names = blocks.map((b) => b.name).sort();
    assert.deepEqual(names, ['droplinked-evil']);
  });

  test('allows other lodash 4.17.x versions', () => {
    const lock = {
      packages: {
        'node_modules/lodash': { name: 'lodash', version: '4.17.21' },
        'node_modules/x/node_modules/lodash': {
          name: 'lodash',
          version: '4.17.20',
        },
      },
    };
    assert.deepEqual(scanLockfile(lock), []);
  });
});

describe('preinstall-supply-chain-guard version comparison', () => {
  test('parseVersion accepts bare and partial versions, rejects non-versions', () => {
    assert.deepEqual(parseVersion('3'), { major: 3, minor: 0, patch: 0, prerelease: null });
    assert.deepEqual(parseVersion('3.5'), { major: 3, minor: 5, patch: 0, prerelease: null });
    assert.deepEqual(parseVersion('v3.5.0'), { major: 3, minor: 5, patch: 0, prerelease: null });
    assert.deepEqual(parseVersion('3.5.0-rc.1'), { major: 3, minor: 5, patch: 0, prerelease: 'rc.1' });
    assert.deepEqual(parseVersion('3.5.0+build.7'), { major: 3, minor: 5, patch: 0, prerelease: null });

    for (const notAVersion of ['', 'latest', 'file:../local', 'npm:other@1.2.3', undefined, null, 42]) {
      assert.equal(parseVersion(notAVersion), null);
    }
  });

  test('compareVersions orders numerics first and prereleases below their release', () => {
    const cmp = (a, b) => compareVersions(parseVersion(a), parseVersion(b));
    assert.equal(cmp('3.4.0', '3.5.0'), -1);
    assert.equal(cmp('3.10.0', '3.9.0'), 1);
    assert.equal(cmp('4.18.1', '4.18.1'), 0);
    assert.equal(cmp('3.5.0-rc.1', '3.5.0'), -1);
    assert.equal(cmp('3.5.0', '3.5.0-rc.1'), 1);
  });

  test('matchesRange ignores unreadable versions and refuses an empty band', () => {
    assert.equal(matchesRange('2.5.0', { gte: '2.0.0', lte: '3.4.0' }), true);
    assert.equal(matchesRange('1.9.1', { gte: '2.0.0', lte: '3.4.0' }), false);
    assert.equal(matchesRange('3.5.0', { gte: '2.0.0', lte: '3.4.0' }), false);
    // A prerelease of the patch is still the patch line, not the vulnerable band.
    assert.equal(matchesRange('3.5.0-rc.1', { gte: '2.0.0', lte: '3.4.0' }), false);
    // Unreadable version -> no match (stated gap: this guard does not judge
    // file:/npm: aliases).
    assert.equal(matchesRange('file:../vendor/stream-json', { gte: '2.0.0', lte: '3.4.0' }), false);
    // An empty band must never match everything.
    assert.equal(matchesRange('9.9.9', {}), false);
  });
});

describe('preinstall-supply-chain-guard production path (the command npm runs)', () => {
  test('package.json scripts.preinstall executes THIS script', () => {
    assert.ok(GUARD_REL, 'scripts.preinstall must name a .js file: ' + PREINSTALL_COMMAND);
    assert.equal(path.resolve(REPO_ROOT, GUARD_REL), GUARD_ABS);
  });

  test('the committed package-lock.json passes the real guard (exit 0)', () => {
    // Exactly what `npm ci` runs, in the real repo root, against the lockfile
    // as committed. Fails if the guard ever starts blocking our own tree.
    const res = runGuardIn(REPO_ROOT);
    assert.equal(res.status, 0, 'guard stderr:\n' + res.stderr);
    assert.doesNotMatch(res.stderr || '', /install blocked/);
  });

  test('a poisoned lockfile FAILS the install: exit 1, packages named on stderr', () => {
    withGuardRoot(
      lockWith({
        'node_modules/stream-json': { name: 'stream-json', version: '3.0.0' },
        'node_modules/lodash': { name: 'lodash', version: '4.19.0' },
        'node_modules/droplinked-sdk': { name: 'droplinked-sdk', version: '0.1.0' },
        'node_modules/fs': { name: 'fs', version: '0.0.1-security' },
      }),
      (root) => {
        const res = runGuardIn(root);
        assert.equal(res.status, 1);
        assert.match(res.stderr, /SUPPLY-CHAIN GUARD: install blocked/);
        assert.match(res.stderr, /stream-json@3\.0\.0/);
        assert.match(res.stderr, /lodash@4\.19\.0/);
        assert.match(res.stderr, /droplinked-sdk@0\.1\.0/);
        assert.match(res.stderr, /fs@0\.0\.1-security/);
      }
    );
  });

  test('the PATCHED stream-json still installs: 1.9.1 and 3.5.0 both exit 0', () => {
    // The regression this file exists to prevent: a ceiling that blocks the
    // patched release turns the one-line bump that closes GHSA-528h-pc64-c93x
    // into a code change, and hard-fails `npm ci` on the Dependabot PR.
    withGuardRoot(
      lockWith({
        'node_modules/stream-json': { name: 'stream-json', version: '1.9.1' },
        'node_modules/jayson/node_modules/stream-json': { name: 'stream-json', version: '3.5.0' },
      }),
      (root) => {
        const res = runGuardIn(root);
        assert.equal(res.status, 0, 'guard stderr:\n' + res.stderr);
      }
    );
  });

  test('missing lockfile exits 0; unparseable lockfile exits 1 with a reason', () => {
    withGuardRoot(null, (root) => {
      const res = runGuardIn(root);
      assert.equal(res.status, 0, 'guard stderr:\n' + res.stderr);
    });

    withGuardRoot('{ not json', (root) => {
      const res = runGuardIn(root);
      assert.equal(res.status, 1);
      assert.match(res.stderr, /failed to parse package-lock\.json/);
    });
  });
});
