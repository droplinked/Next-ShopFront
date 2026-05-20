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
 *   - Any lodash@4.18.x
 *     `lodash` was dormant since 2021. New maintainers were added to the npm
 *     package in March 2026 and pushed 4.18.0 + 4.18.1. Both are on
 *     registry.npmjs.org. The maintainer identity has not been independently
 *     vetted, so we pin to the last known-good 4.17.21 and refuse anything
 *     in the 4.18.x line until the new maintainers are vetted.
 *
 *   - `fs` at `0.0.1-security`
 *     Typo-squat security-placeholder published by npm to occupy the `fs`
 *     namespace. Real Node.js `fs` is a built-in and never appears in a lockfile.
 *
 * The guard runs cleanly on a fresh checkout where node_modules does not yet
 * exist: if package-lock.json is missing (e.g. very first `npm install` on a
 * fresh clone with no lockfile), it exits 0 and lets install proceed.
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

const POISON_VERSION_RANGES = [
  {
    name: 'lodash',
    test: (v) => /^4\.18\./.test(v),
    reason:
      'lodash@4.18.x was published in March 2026 by a newly-added maintainer after years of dormancy; pinned to 4.17.21 until maintainer identity vetted',
  },
];

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
    if (name === p.name && p.test(version)) {
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

module.exports = { scanLockfile };
