#!/usr/bin/env node
/* eslint-disable */
/**
 * Preinstall supply-chain guard.
 *
 * Reads package-lock.json and refuses to let `npm install` continue if any
 * dependency resolves to a known-hostile or known-poison-suspect package:
 *
 *   - Any package name matching /^droplinked-/
 *     The legitimate first-party scope is `@droplinked_inc/*` (underscore +
 *     scope prefix). Bare `droplinked-*` names on the public registry are
 *     squatters and must never resolve into our dependency graph.
 *
 *   - lodash beyond the OpenJS-reboot-vetted 4.18.1 ceiling
 *     4.18.0/4.18.1 were vetted via Socket.dev + OpenJS governance
 *     (Sovereign-Tech-Agency-funded security reboot). 4.18.0 patches
 *     CVE-2026-4800 (GHSA-r5fr-rjxr-66jc, high-sev `_.template` code
 *     injection). 4.17.x and 4.18.x (up to 4.18.1) are allowed.
 *     Anything above 4.18.1 needs re-vetting.
 *
 *   - stream-json in the band [2.0.0, 3.4.0]
 *     GHSA-528h-pc64-c93x (medium, DoS in jayson's *server* request-stream
 *     parser) is vulnerable through 3.4.0 and FIRST PATCHED IN 3.5.0. Two
 *     boundaries, both deliberate:
 *
 *       * 1.x is NOT blocked. It is inside the vulnerable range, and it is
 *         also the only line `jayson` (via @solana/web3.js) resolves — it is
 *         what is installed today. Blocking it would fail every install in
 *         the repo and close nothing; the exposure is tracked openly as
 *         Dependabot alert #176 instead of being hidden behind a red install.
 *       * 3.5.0 and above are NOT blocked either. They are the PATCHED
 *         releases. A ceiling that blocks the patch guarantees the advisory
 *         can never be closed without a code change, which is the opposite of
 *         what a security control is for.
 *
 *     What is left — 2.0.0 through 3.4.0 — is the band that is still
 *     vulnerable and that nothing in the tree asks for: no declared range
 *     resolves there, so an entry in that band can only arrive through a hand
 *     -written `overrides` pin, and it would carry the advisory without the
 *     compatibility of 1.x.
 *
 *     Compatibility note, deliberately NOT enforced here: stream-json 3.x is
 *     ESM-only (`"type": "module"`), needs Node >=22, and its `exports` map
 *     dropped `streamers/StreamValues` and `utils/Verifier` — the two paths
 *     `jayson/lib/utils.js` requires. In the installed tree that file is only
 *     reachable through `require('jayson')` (the package root), and nothing
 *     here does that: @solana/web3.js imports `jayson/lib/client/browser` in
 *     all four of its builds, which pulls in `uuid` + `generateRequest` only.
 *     So a 3.x bump is a compatibility question for whoever raises jayson,
 *     not a reason for this guard to refuse the patched release.
 *
 *   - `fs` at `0.0.1-security`
 *     Typo-squat security-placeholder published by npm to occupy the `fs`
 *     namespace. Real Node.js `fs` is a built-in and never appears in a lockfile.
 *
 * WHAT THIS GUARD DOES AND DOES NOT INTERCEPT (measured on npm 10.9.3, not
 * assumed — see scripts/__tests__/preinstall-supply-chain-guard.spec.js):
 *
 *   `npm ci`                      preinstall RUNS, against the committed
 *                                 lockfile, before any package is unpacked.
 *                                 This is the CI and Dockerfile path, and it
 *                                 is where the guard actually stops things.
 *   `npm install` (no args)       preinstall RUNS — but npm has already
 *                                 written the recomputed lockfile to disk by
 *                                 then. node_modules is not populated with the
 *                                 blocked package; the lockfile edit is, so
 *                                 the cleanup is `git checkout package-lock.json`.
 *   `npm install --package-lock-only`  same as above.
 *   `npm install <pkg>`           preinstall DOES NOT RUN AT ALL. A targeted
 *                                 add is a blind spot: the lockfile is mutated
 *                                 with no hook fired. It is caught on the next
 *                                 full install — in practice, in CI, since a
 *                                 lockfile change is never classified docs-only
 *                                 and therefore always reaches `npm ci` in
 *                                 pre-merge-checks.
 *
 * So this is a blocker at every install that consumes a lockfile, and a
 * detector — not a preventer — of the edit that produced one.
 *
 * The guard runs cleanly on a fresh checkout where node_modules does not yet
 * exist: it requires nothing but Node built-ins (preinstall runs BEFORE
 * dependencies are installed, so it cannot use semver or any other package),
 * and if package-lock.json is missing it exits 0 and lets install proceed.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LOCKFILE_PATH = path.resolve(__dirname, '..', 'package-lock.json');

const HOSTILE_NAME_PATTERNS = [
  {
    pattern: /^droplinked-/,
    reason:
      'package name matches /^droplinked-/ — the legitimate first-party scope is @droplinked_inc/* (underscore + scope prefix); bare droplinked-* names on the public registry are squatters',
  },
];

const POISON_EXACT = [
  {
    name: 'fs',
    version: '0.0.1-security',
    reason: 'typo-squat security-placeholder for built-in node:fs',
  },
];

// Blocked version bands, declared as data. Bounds are inclusive/exclusive per
// key: { gt, gte, lt, lte }. Every bound listed for an entry must hold for the
// version to be blocked, so a two-sided band is written as gte + lte.
const POISON_VERSION_RANGES = [
  {
    name: 'stream-json',
    range: { gte: '2.0.0', lte: '3.4.0' },
    reason:
      'stream-json 2.0.0-3.4.0 is inside the GHSA-528h-pc64-c93x vulnerable range (<= 3.4.0, patched in 3.5.0) and no declared range in this tree resolves there — jayson pins ^1.9.1. 1.x is allowed because it is what actually installs (tracked as Dependabot alert #176); 3.5.0+ is allowed because it is the patched line and must be able to land as a lockfile bump',
  },
  {
    name: 'lodash',
    range: { gt: '4.18.1' },
    reason:
      'lodash version is beyond the OpenJS-reboot-vetted 4.18.1 ceiling — re-vet maintainership before allowing',
  },
];

/**
 * Parse a lockfile version string into comparable parts.
 *
 * Accepts `3`, `3.5`, `3.5.0`, `v3.5.0`, `3.5.0-rc.1`, `3.5.0+build`. Missing
 * minor/patch default to 0, so a bare major like `3` is a real version and not
 * an unparseable one — the previous `/^(\d+)\./` form silently ignored it.
 *
 * Returns null for anything that is not a plain version (`file:../x`,
 * `npm:foo@1.2.3`, `''`, a link entry with no version at all). Callers treat
 * null as "no match": an entry whose version cannot be read is not blocked,
 * because blocking on an unreadable field would fail installs on shapes this
 * guard was never meant to judge. That is a stated gap, not an oversight.
 */
function parseVersion(raw) {
  if (typeof raw !== 'string') return null;
  const m = /^\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?\s*$/.exec(raw);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2] === undefined ? 0 : m[2]),
    patch: Number(m[3] === undefined ? 0 : m[3]),
    prerelease: m[4] === undefined ? null : m[4],
  };
}

/**
 * Order two parsed versions: -1 / 0 / 1.
 *
 * Numeric fields first, then semver's rule that a prerelease sorts BELOW the
 * release it precedes (3.5.0-rc.1 < 3.5.0). Comparison between two different
 * prerelease tags falls back to a plain string compare, which is not full
 * semver identifier ordering — it is never load-bearing here because every
 * bound in POISON_VERSION_RANGES is a release version, so at most one side of
 * any comparison carries a prerelease tag.
 */
function compareVersions(a, b) {
  for (const field of ['major', 'minor', 'patch']) {
    if (a[field] !== b[field]) return a[field] < b[field] ? -1 : 1;
  }
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === null) return 1;
  if (b.prerelease === null) return -1;
  return a.prerelease < b.prerelease ? -1 : 1;
}

/**
 * Does `rawVersion` fall inside a declared band? Unparseable versions and
 * unparseable bounds match nothing.
 */
function matchesRange(rawVersion, range) {
  const v = parseVersion(rawVersion);
  if (!v) return false;

  const bounds = [
    ['gt', (c) => c > 0],
    ['gte', (c) => c >= 0],
    ['lt', (c) => c < 0],
    ['lte', (c) => c <= 0],
  ];

  let sawBound = false;
  for (const [key, ok] of bounds) {
    if (range[key] === undefined) continue;
    const bound = parseVersion(range[key]);
    if (!bound) return false;
    sawBound = true;
    if (!ok(compareVersions(v, bound))) return false;
  }

  // An empty band would match every version; refuse to treat that as a block.
  return sawBound;
}

function scanLockfile(lock) {
  const blocks = [];

  // npm v7+ lockfile uses "packages" map keyed by install path.
  if (lock.packages && typeof lock.packages === 'object') {
    for (const installPath of Object.keys(lock.packages)) {
      const entry = lock.packages[installPath];
      if (!entry || typeof entry !== 'object') continue;
      const name =
        entry.name ||
        (installPath.startsWith('node_modules/')
          ? installPath.slice('node_modules/'.length).replace(/.*\/node_modules\//, '')
          : '');
      const version = entry.version || '';
      checkOne(name, version, installPath, blocks);
    }
  }

  // npm v6 fallback: "dependencies" tree.
  if (lock.dependencies && typeof lock.dependencies === 'object') {
    const walk = (deps, parentPath) => {
      for (const name of Object.keys(deps)) {
        const dep = deps[name];
        if (!dep || typeof dep !== 'object') continue;
        const here = parentPath + '/node_modules/' + name;
        checkOne(name, dep.version || '', here, blocks);
        if (dep.dependencies) walk(dep.dependencies, here);
      }
    };
    walk(lock.dependencies, '');
  }

  return blocks;
}

function checkOne(name, version, installPath, blocks) {
  if (!name) return;

  for (const p of HOSTILE_NAME_PATTERNS) {
    if (p.pattern.test(name)) {
      blocks.push({ name, version, installPath, reason: p.reason });
    }
  }

  for (const p of POISON_EXACT) {
    if (name === p.name && version === p.version) {
      blocks.push({ name, version, installPath, reason: p.reason });
    }
  }

  for (const p of POISON_VERSION_RANGES) {
    if (name === p.name && matchesRange(version, p.range)) {
      blocks.push({ name, version, installPath, reason: p.reason });
    }
  }
}

function main() {
  if (!fs.existsSync(LOCKFILE_PATH)) {
    // Fresh clone without a lockfile (very rare in CI, but support the case).
    process.exit(0);
  }

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(LOCKFILE_PATH, 'utf8'));
  } catch (err) {
    console.error('[preinstall-supply-chain-guard] failed to parse package-lock.json:', err.message);
    process.exit(1);
  }

  const blocks = scanLockfile(lock);
  if (blocks.length === 0) {
    return;
  }

  console.error('');
  console.error('========================================================================');
  console.error(' SUPPLY-CHAIN GUARD: install blocked');
  console.error('========================================================================');
  for (const b of blocks) {
    console.error('');
    console.error('  package : ' + b.name + '@' + b.version);
    console.error('  path    : ' + b.installPath);
    console.error('  reason  : ' + b.reason);
  }
  console.error('');
  console.error(' Resolve the entry in package.json / overrides and regenerate');
  console.error(' package-lock.json with `npm install --legacy-peer-deps` before retrying.');
  console.error('========================================================================');
  console.error('');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  scanLockfile,
  parseVersion,
  compareVersions,
  matchesRange,
  POISON_VERSION_RANGES,
};
