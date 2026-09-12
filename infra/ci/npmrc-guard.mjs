#!/usr/bin/env node
// Refuses any resolution-affecting `.npmrc` setting that has not been decided
// on the record. Next-ShopFront#294.
//
//     node infra/ci/npmrc-guard.mjs [--npmrc PATH]
//
// Proven both directions by infra/ci/__tests__/npmrc-guard.test.sh.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY A GUARD ON A FILE OF THREE LINES
// ═══════════════════════════════════════════════════════════════════════════
//
// `.npmrc` is the only configuration npm reads on EVERY resolution, in every
// context, with no command line to inspect: the Dockerfile's install, the PR
// gate's install, `lockfile-maintenance.yml`'s regeneration steps, Dependabot's
// updater, and a developer's `npm install`. A single line here silently
// overrides flags that were chosen deliberately, per-site, for measured
// reasons — and the override is invisible at every call site.
//
// ⭐ The install flag and the lockfile-GENERATION flag are not the same
// decision, and .npmrc cannot tell them apart. The deploy installs with
// `--legacy-peer-deps` (Dockerfile:31) and must. Nothing here should generate
// a lockfile with it. One line in .npmrc silently converts the second into
// the first — that is the concrete case this guard exists for, and it is the
// change droplinked-shopfront#693 made for reasons that do not hold here.
//
// Measured on dev @ 21956bf, npm 10.9.3, node 22.18.0, in three isolated
// checkouts of the same commit:
//
//   INSTALL-time, from the committed lockfile
//     npm ci                                             890 packages, 3 unmet edges
//     npm ci --legacy-peer-deps                          890 packages, 3 unmet edges
//
//   GENERATION-time, in place, from the committed lockfile
//     npm install --package-lock-only                    978 entries, byte-identical
//     npm install --package-lock-only --force            978 entries, byte-identical
//     npm install --package-lock-only --legacy-peer-deps 927 entries, 51 DROPPED
//
// The 51 removals are peer entries and their subtrees:
// @droplinked_inc/wallet-connection and @droplinked_inc/web3-kit (declared
// peers of the first-party runtime package @droplinked_inc/web3), webpack
// (peer of @sentry/webpack-plugin, taking its 38-package closure with it),
// and fastestsmallesttextencoderdecoder (peer of @solana/codecs-strings).
// The ratchet reports 4 NEW unmet edges on that tree. `next build`,
// `tsc --noEmit` and `npm test` all stay GREEN.
//
// 🚨 A peer disappearing takes its whole subtree with it, so the damage reads
// as routine pruning in a lockfile diff. 41 of the 51 are top-level entries
// and only 4 of them are the actual peers.
//
// It also breaks two controls that are bare ON PURPOSE, both documented in
// `lockfile-maintenance.yml`: the `npm update/install --package-lock-only`
// refresh steps and the `npm ci --dry-run` verification, whose entire value
// is being a STRICT install that can report `Missing: … from lock file`.
// That workflow now runs the ratchet after every refresh (#294), which is the
// assertion that a regeneration did not lose peer entries.
//
// ── What this guard does NOT do ──────────────────────────────────────────
// It does not forbid change. It forbids UNRECORDED change: add the key to
// ALLOWED below with a reason and a measurement, and the guard goes green.
// That is the difference between a decision and a drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../..');

// Keys npm applies to dependency RESOLUTION or to what a lockfile contains.
// Anything matched here must appear in ALLOWED, with a reason, or the run
// fails. Deliberately a denylist of dangerous keys rather than an allowlist of
// every npm setting: `audit-level`, `registry`, `save-exact` and friends
// cannot change the installed tree, and failing on them would train people to
// edit this list without reading it.
const RESOLUTION_AFFECTING = new Set([
  'legacy-peer-deps',
  'strict-peer-deps',
  'force',
  'omit',
  'include',
  'install-strategy',
  'legacy-bundling',
  'global-style',
  'package-lock',
  'lockfile-version',
  'save-peer',
  'prefer-dedupe',
  'install-links',
  'node-linker',
]);

// Decided, on the record. A key here is permitted at exactly this value.
const ALLOWED = new Map([
  // (empty today — see the header. `legacy-peer-deps` is deliberately absent.)
]);

const args = process.argv.slice(2);
let npmrcPath = path.join(REPO_ROOT, '.npmrc');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--npmrc') npmrcPath = path.resolve(args[++i] ?? '');
  else {
    console.error(`::error::unknown argument '${args[i]}'. Usage: npmrc-guard.mjs [--npmrc PATH]`);
    process.exit(1);
  }
}

let raw;
try {
  raw = readFileSync(npmrcPath, 'utf8');
} catch (err) {
  // 🚨 A MISSING .npmrc IS A FAILURE, not a pass. This guard's whole value is
  // that it has read the file; "there was nothing to read" is the shape of
  // every control that quietly stops checking.
  console.error(`::error title=.npmrc not found::cannot read ${npmrcPath} (${err.message}). A guard that reads nothing passes everything.`);
  process.exit(1);
}

const settings = [];
raw.split('\n').forEach((line, i) => {
  const text = line.trim();
  if (!text || text.startsWith('#') || text.startsWith(';') || text.startsWith('[')) return;
  const eq = text.indexOf('=');
  if (eq < 0) return;
  settings.push({ line: i + 1, key: text.slice(0, eq).trim().toLowerCase(), value: text.slice(eq + 1).trim() });
});

console.log(`npmrc-guard — ${npmrcPath}`);
console.log(`  ${settings.length} setting(s):`);
for (const s of settings) console.log(`    ${s.line}: ${s.key}=${s.value}`);

// 🚨 The `-ge N` assertion. A parser that silently stops matching reports a
// clean file, which is indistinguishable from a clean file. This repo's .npmrc
// has carried at least registry/save-exact/audit-level since it was created;
// zero parsed settings means the parser broke, not that the file emptied.
if (settings.length < 1) {
  console.error(`::error title=npmrc-guard parsed 0 settings::${npmrcPath} yielded no key=value lines. Either the file was emptied (say so deliberately and lower this floor in the same PR) or the parser stopped matching — in which case this guard has been passing without reading anything.`);
  process.exit(1);
}

const violations = [];
for (const s of settings) {
  if (!RESOLUTION_AFFECTING.has(s.key)) continue;
  const allowed = ALLOWED.get(s.key);
  if (allowed === undefined) {
    violations.push(`${npmrcPath}:${s.line}  ${s.key}=${s.value} — resolution-affecting and NOT on the record.`);
  } else if (allowed.value !== s.value) {
    violations.push(`${npmrcPath}:${s.line}  ${s.key}=${s.value} — recorded value is '${allowed.value}' (${allowed.reason}).`);
  } else {
    console.log(`  decided: ${s.key}=${s.value} — ${allowed.reason}`);
  }
}

if (violations.length) {
  console.error(`::error title=${violations.length} unrecorded resolution-affecting .npmrc setting(s)::a line here overrides every per-site install flag in the repo at once, invisibly, including lockfile-maintenance.yml's deliberately-bare refresh steps and Dependabot's updater.`);
  for (const v of violations) console.error(`  ${v}`);
  console.error('');
  console.error('  If this is deliberate: add the key to ALLOWED in infra/ci/npmrc-guard.mjs with a reason and a MEASUREMENT of what it does to the installed tree, in the same pull request, and re-run the peer-conflict ratchet against the regenerated lockfile.');
  console.error('  For `legacy-peer-deps` specifically, read the header of that file first: it was measured on this repo and it drops 70 lockfile entries, two of them first-party peers, while every gate stays green.');
  process.exit(1);
}

console.log(`  ok   npmrc-guard — no unrecorded resolution-affecting setting`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    ['### npmrc-guard', '', `\`${path.relative(REPO_ROOT, npmrcPath)}\` — ${settings.length} setting(s), none resolution-affecting outside the record.`, '',
     '| line | key | value |', '| ---: | --- | --- |',
     ...settings.map((s) => `| ${s.line} | \`${s.key}\` | \`${s.value}\` |`), ''].join('\n') + '\n',
  );
}
process.exit(0);
