#!/usr/bin/env node
// Runs ESLint and REPORTS the count. Fails only when the LINTER is dead.
// Next-ShopFront#287.
//
//     node infra/ci/eslint-report.mjs [--cwd DIR] [--floor N]
//
// Proven both directions by infra/ci/__tests__/eslint-report.test.sh, over
// synthetic trees that MUST fail it, in the same run as the clean case.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY REPORT-ONLY ON FINDINGS, AND HARD ON THE LINTER ITSELF
// ═══════════════════════════════════════════════════════════════════════════
//
// Before #287 this repo had ZERO lint coverage and nothing said so. The
// config was eslintrc, eslint@10 rejects eslintrc, `npm run lint` exited 1
// having linted nothing, no workflow invoked it, and `next build` printed the
// crash as a non-fatal warning and exited 0. The defect was never a red
// check — it was the absence of one.
//
// So the two failure modes are NOT the same thing and must not share a
// severity:
//
//   "the code has 10 lint errors"   -> a backlog. REPORT it.
//   "ESLint linted 0 files"         -> the control is dead. FAIL.
//
// Turning the first into a gate in the landing change would red every open PR
// against a backlog nobody has triaged, and the predictable result is people
// re-running checks without reading them — which is how a real failure gets
// waved through. The count is printed on every run, with the delta against
// `infra/ci/eslint-baseline.json`, so a follow-up can ratchet deliberately.
//
// The second is the whole point of the issue and is a HARD failure here.
//
// ── The floor is the `-ge N` assertion, and it is the load-bearing part ───
// A linter that silently stops matching files exits 0 having found nothing —
// indistinguishable, from the outside, from a clean repo. `fileFloor` is what
// makes those two different. Raise it when you add source; lower it only
// alongside a deliberate deletion, in the same PR, with the reason written.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../..');

function parseArgs(argv) {
  const out = { cwd: REPO_ROOT, floor: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cwd') out.cwd = path.resolve(argv[++i] ?? '');
    else if (argv[i] === '--floor') out.floor = Number(argv[++i]);
    else {
      console.error(`::error::unknown argument '${argv[i]}'. Usage: eslint-report.mjs [--cwd DIR] [--floor N]`);
      process.exit(1);
    }
  }
  if (out.floor !== null && !Number.isInteger(out.floor)) {
    console.error(`::error::--floor must be an integer`);
    process.exit(1);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

// Baseline is advisory EXCEPT for fileFloor. Absent baseline is not fatal
// when --floor is supplied (the test fixtures rely on that); in the repo it
// must exist, or the floor would silently become 0 and the control dead.
let baseline = null;
const BASELINE_PATH = path.join(REPO_ROOT, 'infra/ci/eslint-baseline.json');
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
} catch (err) {
  if (args.floor === null) {
    console.error(`::error::cannot read ${BASELINE_PATH} (${err.message}). Without it there is no fileFloor, and a linter that matches nothing would report a clean repo.`);
    process.exit(1);
  }
}

const floor = args.floor ?? baseline?.fileFloor;
if (!Number.isInteger(floor) || floor < 1) {
  console.error(`::error::no usable fileFloor (got ${JSON.stringify(floor)}). A floor of 0 is not a floor.`);
  process.exit(1);
}

// Load ESLint from the tree under test, not from this script's own resolution
// path — the fixtures in the test suite are separate installs.
const { ESLint } = await import('eslint');

let results;
let eslintVersion = 'unknown';
try {
  eslintVersion = ESLint.version ?? 'unknown';
  const eslint = new ESLint({ cwd: args.cwd, errorOnUnmatchedPattern: false });
  results = await eslint.lintFiles(['.']);
} catch (err) {
  // 🚨 THE FAILURE THIS FILE EXISTS FOR. An unloadable config, a parser that
  // throws, a plugin incompatible with the installed eslint — every one of
  // them lands here, and every one of them means the repo is UNLINTED. This
  // is exactly the state dev was in before #287, and it must be red.
  console.error('::error title=ESLint could not run::the repository is UNLINTED. This is not a lint finding; it is the absence of linting.');
  console.error(String(err?.stack ?? err));
  process.exit(1);
}

const scanned = results.length;
let errors = 0;
let warnings = 0;
let filesWithProblems = 0;
const byRule = new Map();

for (const r of results) {
  errors += r.errorCount;
  warnings += r.warningCount;
  if (r.errorCount || r.warningCount) filesWithProblems++;
  for (const m of r.messages) {
    const key = `${m.ruleId ?? '(no rule — directive or parse)'}|${m.severity === 2 ? 'error' : 'warning'}`;
    byRule.set(key, (byRule.get(key) ?? 0) + 1);
  }
}

const ranked = [...byRule.entries()].sort((a, b) => b[1] - a[1]);

console.log(`eslint ${eslintVersion} over ${args.cwd}`);
console.log(`  scanned ${scanned} file(s); ${filesWithProblems} with problems; ${errors} error(s), ${warnings} warning(s)`);
for (const [key, n] of ranked) {
  const [rule, sev] = key.split('|');
  console.log(`    ${String(n).padStart(5)}  ${rule} [${sev}]`);
}

// ── HARD: the floor ───────────────────────────────────────────────────────
if (scanned < floor) {
  console.error(`::error title=ESLint matched ${scanned} file(s), below the floor of ${floor}::a linter that matches nothing exits clean. Either the ignores/patterns in eslint.config.mjs stopped matching the app, or source was deleted. If the deletion was deliberate, lower fileFloor in infra/ci/eslint-baseline.json in the SAME pull request, with the reason.`);
  process.exit(1);
}

// ── REPORT: the drift, never a failure ────────────────────────────────────
let driftLine = '';
if (baseline?.observed) {
  const de = errors - baseline.observed.errors;
  const dw = warnings - baseline.observed.warnings;
  const sign = (n) => (n > 0 ? `+${n}` : String(n));
  driftLine = `since the baseline (${baseline.observed.measuredOn}): ${sign(de)} error(s), ${sign(dw)} warning(s)`;
  console.log(`  ${driftLine}`);
  if (de > 0) {
    // 🚨 A NOTICE, NOT AN ERROR, AND DELIBERATELY SO. Read the header before
    // promoting this to ::error:: — that promotion is the follow-up ratchet,
    // and it needs the backlog triaged first, not a flag flip.
    console.log(`::notice title=${de} new ESLint error(s) since the baseline::report-only today (Next-ShopFront#287). Retiring the backlog and making this a gate is the follow-up.`);
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  const lines = [
    '### eslint-report (REPORT-ONLY — see infra/ci/eslint-report.mjs)',
    '',
    `\`eslint ${eslintVersion}\` — **${scanned}** files scanned (floor ${floor}), **${filesWithProblems}** with problems, **${errors}** errors, **${warnings}** warnings.`,
    '',
    driftLine ? `${driftLine}` : '',
    '',
    '| count | rule | severity |',
    '| ---: | --- | --- |',
    ...ranked.map(([key, n]) => {
      const [rule, sev] = key.split('|');
      return `| ${n} | \`${rule}\` | ${sev} |`;
    }),
    '',
    'Findings here do NOT fail the build. What DOES fail it is ESLint being unable to run, or matching fewer than the floor — the state this repo was in until #287, when lint covered zero files and nothing said so.',
  ];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}

process.exit(0);
