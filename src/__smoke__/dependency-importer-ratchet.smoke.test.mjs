// Both directions, in one run: synthetic trees that MUST fail the shipped
// dependency-importer ratchet, and the real repository which MUST pass it.
//
// The failing cases come first on purpose. A checker that can only be observed
// passing has not been observed at all — the whole reason this file exists is
// that on 2026-09-12 a `grep` audit of this repository returned 0 importers
// for every package INCLUDING its control and exited 0, and only the control
// caught it.
//
// Every case drives the CLI the way CI drives it — `node <script>` as a child
// process, asserting the EXIT CODE — not the exported helpers. A guard whose
// tests call its internals stays green when `process.exit(1)` becomes
// `process.exit(0)`; that mutation was measured on this repo's
// preinstall-supply-chain-guard (PR #271) and is the failure this avoids.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SCRIPT = path.join(REPO_ROOT, 'infra', 'ci', 'dependency-importer-ratchet.mjs');
const REAL_ALLOWLIST = path.join(REPO_ROOT, 'infra', 'ci', 'dependency-importer-allowlist.json');
const WORKFLOW = path.join(REPO_ROOT, '.github', 'workflows', 'pre-merge-checks.yml');

/** The five removed on 2026-09-12. Reintroducing any without an importer must fail. */
const REMOVED = ['ethers', 'casper-js-sdk', '@uauth/js', '@solana/spl-token', '@mui/icons-material'];

/** A package name nothing in this repository depends on — see the note in the allowlist-shrinks case. */
const FIXTURE_PKG = '@fixture-only/not-a-real-package';

function run(tree, allowlist) {
  const args = [SCRIPT];
  if (tree) args.push('--tree', tree);
  if (allowlist) args.push('--allowlist', allowlist);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

let fixtureSeq = 0;
/** A throwaway tree: package.json + an allowlist + `files` as { relPath: contents }. */
function fixture({ dependencies = {}, allowlist, files = {} }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `dep-importer-${fixtureSeq++}-`));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fixture', dependencies }, null, 2));
  const alPath = path.join(dir, 'allowlist.json');
  fs.writeFileSync(alPath, JSON.stringify(allowlist, null, 2));
  for (const [rel, contents] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }
  return { dir, allowlistPath: alPath };
}

const BASE_ALLOWLIST = { fileFloor: 2, controls: ['react'], entries: {} };
const REACT_FILES = {
  'src/a.tsx': "import React from 'react';\nexport default React;\n",
  'src/b.tsx': "import { useState } from 'react';\nexport { useState };\n",
};

// ── MUST FAIL ──────────────────────────────────────────────────────────────

test('FAILS on a dependency that nothing imports, and names it', () => {
  const { dir, allowlistPath } = fixture({
    dependencies: { react: '^18.2.0', ethers: '^5.7.2' },
    allowlist: BASE_ALLOWLIST,
    files: REACT_FILES,
  });
  const { code, out } = run(dir, allowlistPath);
  assert.equal(code, 1, `expected exit 1, got ${code}\n${out}`);
  assert.match(out, /ethers@\^5\.7\.2/, out);
});

test('FAILS on each of the five packages removed on 2026-09-12, reintroduced without an importer', () => {
  for (const pkg of REMOVED) {
    const { dir, allowlistPath } = fixture({
      dependencies: { react: '^18.2.0', [pkg]: '^1.0.0' },
      allowlist: BASE_ALLOWLIST,
      files: REACT_FILES,
    });
    const { code, out } = run(dir, allowlistPath);
    assert.equal(code, 1, `${pkg}: expected exit 1, got ${code}\n${out}`);
    assert.ok(out.includes(pkg), `${pkg}: not named in the output\n${out}`);
  }
});

test('PASSES the same five once something actually imports them — the check is "imported", not a denylist', () => {
  for (const pkg of REMOVED) {
    const { dir, allowlistPath } = fixture({
      dependencies: { react: '^18.2.0', [pkg]: '^1.0.0' },
      allowlist: BASE_ALLOWLIST,
      files: { ...REACT_FILES, 'src/uses.ts': `import x from '${pkg}';\nexport default x;\n` },
    });
    const { code, out } = run(dir, allowlistPath);
    assert.equal(code, 0, `${pkg}: expected exit 0, got ${code}\n${out}`);
  }
});

test('FAILS when an allowlisted package acquires an importer — the list shrinks, it does not linger', () => {
  // FIXTURE_PKG is deliberately a name no real dependency has. An earlier
  // revision used 'sharp' here and the literal `from 'sharp'` inside this
  // file's fixture strings registered as a real importer of the real sharp
  // when the ratchet scanned the repo, failing its own "PASSES the real tree"
  // case. Fixture module names must not collide with real package names.
  const { dir, allowlistPath } = fixture({
    dependencies: { react: '^18.2.0', [FIXTURE_PKG]: '^1.0.0' },
    allowlist: { ...BASE_ALLOWLIST, entries: { [FIXTURE_PKG]: { reason: 'a reason long enough to satisfy the schema check' } } },
    files: { ...REACT_FILES, 'src/uses.ts': `import x from '${FIXTURE_PKG}';\nexport default x;\n` },
  });
  const { code, out } = run(dir, allowlistPath);
  assert.equal(code, 1, `expected exit 1, got ${code}\n${out}`);
  assert.match(out, /no longer justified/, out);
});

test('FAILS when an allowlist entry is no longer a dependency at all', () => {
  const { dir, allowlistPath } = fixture({
    dependencies: { react: '^18.2.0' },
    allowlist: { ...BASE_ALLOWLIST, entries: { ethers: { reason: 'a reason long enough to satisfy the schema check' } } },
    files: REACT_FILES,
  });
  const { code, out } = run(dir, allowlistPath);
  assert.equal(code, 1, `expected exit 1, got ${code}\n${out}`);
  assert.match(out, /no longer a dependency/, out);
});

test('FAILS on a scan over too few files — an empty scan condemns everything and must not reach a verdict', () => {
  const { dir, allowlistPath } = fixture({
    dependencies: { react: '^18.2.0' },
    allowlist: { fileFloor: 500, controls: ['react'], entries: {} },
    files: REACT_FILES,
  });
  const { code, out } = run(dir, allowlistPath);
  assert.equal(code, 1, `expected exit 1, got ${code}\n${out}`);
  assert.match(out, /below the floor of 500/, out);
  assert.doesNotMatch(out, /imported by NOTHING/, `a broken scan must not also emit per-package verdicts\n${out}`);
});

test('FAILS when a control package resolves to zero importers — the scanner-is-broken case', () => {
  const { dir, allowlistPath } = fixture({
    dependencies: { react: '^18.2.0' },
    allowlist: { fileFloor: 2, controls: ['react'], entries: {} },
    // Two files, neither importing react: the file floor passes, the control does not.
    files: { 'src/a.ts': 'export const a = 1;\n', 'src/b.ts': 'export const b = 2;\n' },
  });
  const { code, out } = run(dir, allowlistPath);
  assert.equal(code, 1, `expected exit 1, got ${code}\n${out}`);
  assert.match(out, /control package\(s\) with ZERO importers: react/, out);
});

test('FAILS on an allowlist entry with no reason — an exemption nobody wrote down is not an exemption', () => {
  const { dir, allowlistPath } = fixture({
    dependencies: { react: '^18.2.0', [FIXTURE_PKG]: '^1.0.0' },
    allowlist: { ...BASE_ALLOWLIST, entries: { [FIXTURE_PKG]: { reason: 'too short' } } },
    files: REACT_FILES,
  });
  const { code, out } = run(dir, allowlistPath);
  assert.equal(code, 1, `expected exit 1, got ${code}\n${out}`);
  assert.match(out, /needs a "reason"/, out);
});

test('FAILS on an allowlist with no controls, and on one with no fileFloor', () => {
  for (const bad of [{ fileFloor: 2, controls: [], entries: {} }, { controls: ['react'], entries: {} }]) {
    const { dir, allowlistPath } = fixture({ dependencies: { react: '^18.2.0' }, allowlist: bad, files: REACT_FILES });
    const { code, out } = run(dir, allowlistPath);
    assert.equal(code, 1, `expected exit 1 for ${JSON.stringify(bad)}, got ${code}\n${out}`);
  }
});

test('a commented-out import does NOT count as an importer, and a URL string is not a comment', () => {
  const dep = '@fixture-only/commented-out';
  const commented = [
    '// ' + "import x from '" + dep + "';",
    '/* ' + "require('" + dep + "')" + ' */',
    "const u = 'https://example.test//path';",
  ].join('\n');
  const { dir, allowlistPath } = fixture({
    dependencies: { react: '^18.2.0', [dep]: '^1.0.0' },
    allowlist: BASE_ALLOWLIST,
    files: { ...REACT_FILES, 'src/commented.ts': commented },
  });
  const { code, out } = run(dir, allowlistPath);
  assert.equal(code, 1, `a dependency mentioned only in comments must still count as unused\n${out}`);
  assert.ok(out.includes(dep), out);

  // Control for the same fixture: uncomment it and the verdict flips, which
  // proves the failure above came from the comment stripping and not from the
  // fixture being broken.
  const live = fixture({
    dependencies: { react: '^18.2.0', [dep]: '^1.0.0' },
    allowlist: BASE_ALLOWLIST,
    files: { ...REACT_FILES, 'src/live.ts': "import x from '" + dep + "';\nexport default x;\n" },
  });
  const second = run(live.dir, live.allowlistPath);
  assert.equal(second.code, 0, `the same dependency with a real import must pass\n${second.out}`);
});

// ── MUST PASS: the real repository, with the real allowlist ────────────────

test('PASSES the real tree', () => {
  const { code, out } = run(null, null);
  assert.equal(code, 0, `the real tree must pass\n${out}`);
  assert.match(out, /ok {3}dependency-importer-ratchet/, out);
});

test('the real allowlist carries controls that are genuinely imported, and a meaningful floor', () => {
  const al = JSON.parse(fs.readFileSync(REAL_ALLOWLIST, 'utf8'));
  assert.ok(al.fileFloor >= 200, `fileFloor ${al.fileFloor} is too low to be a control on this repo`);
  assert.ok(al.controls.includes('react'), 'react must be a control');
  for (const c of al.controls) {
    assert.ok(c in JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')).dependencies, `control ${c} must be a dependency`);
  }
});

test('none of the five removed packages is back in package.json, nor smuggled into the allowlist', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  const al = JSON.parse(fs.readFileSync(REAL_ALLOWLIST, 'utf8'));
  for (const name of REMOVED) {
    assert.ok(!(name in (pkg.dependencies || {})), `${name} is back in dependencies`);
    assert.ok(!(name in (pkg.devDependencies || {})), `${name} is back in devDependencies`);
    assert.ok(!(name in al.entries), `${name} is in the allowlist — reintroducing it must fail the ratchet, not be pre-exempted`);
  }
});

test('the lockfile no longer carries the advisory packages those five were the only carriers of', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package-lock.json'), 'utf8'));
  for (const carrier of ['elliptic', 'stream-json']) {
    const hits = Object.keys(lock.packages).filter((k) => k.endsWith(`node_modules/${carrier}`));
    assert.deepEqual(hits, [], `${carrier} is back in the lockfile at ${hits.join(', ')} — Dependabot alerts #65 / #176 would reopen`);
  }
  // Control: a package that IS expected in the lockfile, so an empty/renamed
  // `packages` map cannot make the two assertions above pass vacuously.
  assert.ok(Object.keys(lock.packages).some((k) => k.endsWith('node_modules/react')), 'lockfile scan found no react — the scan is broken, not the tree clean');
});

// ── MUST PASS: the gate is actually wired ──────────────────────────────────

test('pre-merge-checks.yml runs this ratchet as a hard step in next-build', () => {
  const wf = fs.readFileSync(WORKFLOW, 'utf8');
  assert.match(wf, /^\s+run: node infra\/ci\/dependency-importer-ratchet\.mjs$/m, 'no anchored invocation of the ratchet in the workflow');
  // The step must not be soft-failed. `docs-only-paths.test.sh` asserts the
  // same property over the whole job by literal string search, so this only
  // needs to confirm the step exists inside next-build rather than elsewhere.
  const nextBuild = wf.slice(wf.indexOf('\n  next-build:'), wf.indexOf('\n  pre-merge-gate:'));
  assert.ok(nextBuild.includes('node infra/ci/dependency-importer-ratchet.mjs'), 'the ratchet step is not inside the next-build job');
});

test('npm test would run this file — the glob in package.json still matches it', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /src\/__smoke__\/\*\.test\.mjs/, 'the test script no longer globs src/__smoke__/*.test.mjs');
  assert.ok(fs.existsSync(path.join(REPO_ROOT, 'src', '__smoke__', 'dependency-importer-ratchet.smoke.test.mjs')), 'this file moved out of the glob');
});
