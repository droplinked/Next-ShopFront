#!/usr/bin/env node
// Fails the build on any entry in `dependencies` that NOTHING in the source
// tree imports, unless it is in infra/ci/dependency-importer-allowlist.json
// with a written reason. Next-ShopFront#288.
//
// Run it from the repo root — it needs no node_modules:
//
//     node infra/ci/dependency-importer-ratchet.mjs
//
// Proven both directions by src/__smoke__/dependency-importer-ratchet.smoke.test.mjs,
// which drives the shipped CLI as a child process over synthetic trees that
// MUST fail it before asserting that the real tree passes.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// On 2026-09-12 five runtime dependencies were removed from this repository
// because nothing imported them: `ethers`, `casper-js-sdk`, `@uauth/js`,
// `@solana/spl-token`, `@mui/icons-material`. They were not inert. Between
// them they carried every copy of `elliptic` (3 carriers) and the only copy of
// `stream-json` (1 carrier) in the tree — both live Dependabot alerts — and
// they were the sole reason three dependency-upgrade PRs (#232, #264, #267)
// and one peer lock (#266 <-> #267) existed at all. 179 lockfile entries and
// ~191 MiB of node_modules followed them out.
//
// Nothing in this repository could have said they were unused, and nothing
// would notice if one came back. A removal PR is the easy half; keeping the
// removal is the half that needs a gate. This is that gate.
//
// It is a RATCHET, not a lint: the allowlist may shrink but never grow
// silently. An allowlisted package that acquires an importer FAILS until its
// entry is deleted, so the list cannot quietly accumulate dead weight the way
// `dependencies` did.
//
// ── SCOPE, AND WHY IT STOPS WHERE IT DOES ────────────────────────────────
//
// `dependencies` only. `devDependencies` are overwhelmingly invoked by name
// from configs and CLIs (`eslint`, `postcss`, `autoprefixer`, `@types/*`,
// `@svgr/webpack` as a webpack loader string) rather than imported, so the
// same rule there would be almost entirely allowlist and would assert
// nothing.
//
// ═══════════════════════════════════════════════════════════════════════════
// CONTROLS — AN EMPTY SCAN IS A FAILURE, NOT A PASS
// ═══════════════════════════════════════════════════════════════════════════
//
// A grep over zero files finds zero importers and would condemn every
// dependency; a grep whose pattern silently matches nothing finds zero and
// would condemn them too. Neither must be able to reach a verdict:
//
//   * `fileFloor` — fewer source files than this and the run fails outright.
//   * `controls`  — packages that MUST resolve to at least one importer. If a
//                   control comes back at zero the scanner is broken, and the
//                   run fails before any package is judged. (The 2026-09-12
//                   audit that motivated this file produced exactly that
//                   failure once: a `grep` invoked with a 271-file argument
//                   list exited "File name too long", printed 0 for every
//                   package INCLUDING the control, and exited 0.)
//
// Both are enforced BEFORE the unused check, and the PASS line prints what was
// scanned, because a green run must show what it looked at.

import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRECTORIES = new Set(['node_modules', '.next', '.git', 'playwright-report', 'test-results', 'dist', 'build', 'coverage']);

/** Every source file under `root`, excluding build output and vendored trees. */
export function collectSourceFiles(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out.sort();
}

/**
 * Blank out `//` and block comments, preserving offsets and newlines, without
 * touching quoted text. A comment that mentions a module specifier must not
 * register as an importer: a commented-out import would keep a dead dependency
 * alive forever, which is the exact failure this whole file exists to prevent.
 * (Measured: the first revision of the smoke test described this hazard in
 * prose and its own prose then registered as a real importer.)
 *
 * A single character-state walk rather than a regex, because `'https://x'` and
 * `` `${a}//${b}` `` are not comments and a regex cannot tell.
 */
export function stripComments(text) {
  const out = text.split('');
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '\\') { i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i += 1;
      while (i < n) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i] === quote) { i += 1; break; }
        i += 1;
      }
      continue;
    }
    if (c === '/' && d === '/') {
      while (i < n && text[i] !== '\n') { out[i] = ' '; i += 1; }
      continue;
    }
    if (c === '/' && d === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      for (let j = i; j < stop; j++) if (out[j] !== '\n') out[j] = ' ';
      i = stop;
      continue;
    }
    i += 1;
  }
  return out.join('');
}

// `from 'x'` / `import 'x'` / `import('x')` / `require('x')` / `export … from 'x'`.
// Deliberately regex and not a parser: this must run with no node_modules, in
// the `changes` job, before anything is installed.
const SPECIFIER_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|\bexport\s+\*\s+from\s*)['"`]([^'"`\n]+)['"`]/g;

/**
 * `@scope/name/sub` -> `@scope/name`; `name/sub` -> `name`.
 * Relative paths, the `@/` tsconfig alias, absolute paths, URLs and node:
 * builtins are not packages and return null.
 */
export function packageOfSpecifier(spec) {
  if (!spec) return null;
  if (spec.startsWith('.') || spec.startsWith('/')) return null;
  if (spec.startsWith('@/')) return null; // tsconfig `paths` alias for ./src
  if (spec.includes(':')) return null; // node:fs, data:, https://
  const parts = spec.split('/');
  if (spec.startsWith('@')) {
    if (parts.length < 2 || !parts[1]) return null;
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0] || null;
}

/** package name -> sorted list of files importing it. */
export function indexImporters(files, root) {
  const index = new Map();
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const seen = new Set();
    for (const m of stripComments(text).matchAll(SPECIFIER_RE)) {
      const pkg = packageOfSpecifier(m[1]);
      if (!pkg || seen.has(pkg)) continue;
      seen.add(pkg);
      const rel = path.relative(root, file);
      if (!index.has(pkg)) index.set(pkg, []);
      index.get(pkg).push(rel);
    }
  }
  for (const list of index.values()) list.sort();
  return index;
}

export function readAllowlist(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${file}: expected an object`);
  }
  if (!Number.isInteger(raw.fileFloor) || raw.fileFloor < 1) {
    throw new Error(`${file}: "fileFloor" must be a positive integer (it is the control that an empty scan cannot pass)`);
  }
  if (!Array.isArray(raw.controls) || raw.controls.length === 0 || raw.controls.some((c) => typeof c !== 'string')) {
    throw new Error(`${file}: "controls" must be a non-empty array of package names that MUST have importers`);
  }
  if (typeof raw.entries !== 'object' || raw.entries === null || Array.isArray(raw.entries)) {
    throw new Error(`${file}: "entries" must be an object keyed by package name`);
  }
  for (const [name, meta] of Object.entries(raw.entries)) {
    if (!meta || typeof meta.reason !== 'string' || meta.reason.trim().length < 20) {
      throw new Error(`${file}: entry "${name}" needs a "reason" of at least 20 characters — an allowlist entry without a reason is dead weight nobody decided about`);
    }
  }
  return raw;
}

/**
 * The decision. Pure, so the test drives exactly what the CLI decides.
 */
export function decide({ dependencies, index, fileCount }, allowlist) {
  const failures = [];

  if (fileCount < allowlist.fileFloor) {
    failures.push(
      `scanned ${fileCount} source file(s), below the floor of ${allowlist.fileFloor}. ` +
        'A scan over too few files finds no importers and would condemn every dependency — that is a broken scan, not a finding.',
    );
  }
  const deadControls = allowlist.controls.filter((c) => !index.has(c) || index.get(c).length === 0);
  if (deadControls.length) {
    failures.push(
      `control package(s) with ZERO importers: ${deadControls.join(', ')}. These are known-imported; ` +
        'zero means the scanner is broken, so no verdict is reported on anything else.',
    );
  }
  // A broken scan must not also emit per-package verdicts — they would be noise
  // that reads like findings.
  if (failures.length) return { failures, unused: [], stale: [], fileCount };

  const names = Object.keys(dependencies).sort();
  const allowed = new Set(Object.keys(allowlist.entries));
  const unused = names.filter((n) => !index.has(n) && !allowed.has(n));
  // Shrink-only: an allowlisted package that is now imported, or that is no
  // longer a dependency at all, must have its entry deleted.
  const stale = [...allowed].filter((n) => !(n in dependencies) || index.has(n)).sort();

  if (unused.length) {
    failures.push(
      `${unused.length} dependenc${unused.length === 1 ? 'y is' : 'ies are'} in package.json "dependencies" but imported by NOTHING ` +
        'in the source tree. Remove it, or add it to infra/ci/dependency-importer-allowlist.json with a reason:',
    );
    for (const n of unused) failures.push(`    ${n}@${dependencies[n]}`);
  }
  if (stale.length) {
    failures.push(
      `${stale.length} allowlist entr${stale.length === 1 ? 'y is' : 'ies are'} no longer justified — delete ` +
        'it from infra/ci/dependency-importer-allowlist.json in this PR so the list stays honest:',
    );
    for (const n of stale) {
      failures.push(
        `    ${n} — ${n in dependencies ? `now imported by ${index.get(n).length} file(s), e.g. ${index.get(n)[0]}` : 'no longer a dependency'}`,
      );
    }
  }
  return { failures, unused, stale, fileCount };
}

export function scan(root, allowlist) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const dependencies = pkg.dependencies || {};
  const files = collectSourceFiles(root);
  const index = indexImporters(files, root);
  return { dependencies, index, fileCount: files.length, allowlist };
}

async function main(argv) {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
  let treePath = repoRoot;
  let allowlistFile = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tree') treePath = path.resolve(argv[++i]);
    else if (argv[i] === '--allowlist') allowlistFile = path.resolve(argv[++i]);
    else {
      console.error(`unknown argument ${JSON.stringify(argv[i])}`);
      return 2;
    }
  }
  if (!allowlistFile) allowlistFile = path.join(treePath, 'infra', 'ci', 'dependency-importer-allowlist.json');

  let allowlist;
  try {
    allowlist = readAllowlist(allowlistFile);
  } catch (err) {
    console.error(`::error title=dependency-importer-ratchet cannot read its allowlist::${err.message}`);
    return 1;
  }

  let scanned;
  try {
    scanned = scan(treePath, allowlist);
  } catch (err) {
    console.error(`::error title=dependency-importer-ratchet could not scan::${err.message}`);
    return 1;
  }

  const result = decide(scanned, allowlist);
  console.log(
    `  scanned ${result.fileCount} source file(s); ${Object.keys(scanned.dependencies).length} runtime dependenc(ies); ` +
      `${scanned.index.size} distinct package(s) imported; allowlist has ${Object.keys(allowlist.entries).length}`,
  );
  if (result.failures.length) {
    console.log('  FAIL dependency-importer-ratchet');
    for (const f of result.failures) console.log(`    ${f}`);
    return 1;
  }
  console.log('  ok   dependency-importer-ratchet — every runtime dependency is imported or allowlisted, no stale allowlist entry');
  return 0;
}

// realpath on BOTH sides: on macOS /tmp is a symlink to /private/tmp and a
// plain comparison silently never runs main() — exit 0, no output, a gate that
// reports green by never having looked. (Lifted from peer-conflict-ratchet.mjs,
// where it was measured.)
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
  } catch {
    return false;
  }
}
if (invokedDirectly()) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
