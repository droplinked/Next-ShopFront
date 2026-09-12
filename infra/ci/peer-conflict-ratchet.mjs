#!/usr/bin/env node
// Fails the build on any UNMET dependency edge that is not already in
// infra/ci/peer-conflict-baseline.json — the edges `--legacy-peer-deps`
// silences. droplinked-shopfront#664.
//
// Run it from the repo root, after `npm ci`:
//
//     node infra/ci/peer-conflict-ratchet.mjs
//
// Proven both directions by infra/ci/__tests__/peer-conflict-ratchet.test.sh
// over synthetic node_modules trees that MUST fail it, before the `verify`
// job trusts it over the real tree.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY A RATCHET AND NOT A STRICT `npm ci`
// ═══════════════════════════════════════════════════════════════════════════
//
// Every install in this repository passes `--legacy-peer-deps`. That is not a
// loosening chosen here — it is `Dockerfile:31` (`RUN npm ci
// --legacy-peer-deps`), and `pre-merge-checks.yml`'s `next-build` job matches
// it deliberately so the gate installs exactly what the deploy installs.
// Under that flag npm does not enforce peer ranges, so a dependency bump
// whose peers exclude what is installed is green at install, green at build,
// and no gate has an opinion. Next-ShopFront#285 records the class.
//
// The obvious fix — a strict `npm ci` without the flag — does not work as a
// gate here, and the reason is mechanical, not political. Two reasons, both
// measured on `dev` @ c54f050, npm 10.9.3, node 22.18.0:
//
//   1. Bare `npm ci` already FAILS on this repo (the lockfile is
//      peer-incomplete; see the `next-build` header). A gate that is red on an
//      untouched `dev` is not a gate.
//   2. npm's resolver stops at the FIRST conflict it hits — ERESOLVE reports
//      one pair — and this tree has three before any PR is applied.
//
// This script instead ENUMERATES every unmet edge in the installed tree
// (arborist `loadActual` — the same graph `npm ls` walks), collapses each to a
// stable key, and fails on any key that is not in the baseline. The baseline
// is the set of conflicts this repo has decided to live with, each with a
// note saying why and what retires it. A bump that introduces a NEW conflict
// is red. A bump that resolves an OLD one is also red — until the entry is
// removed from the baseline in the same PR — so the baseline can only shrink
// honestly.
//
// ── WHAT IT CATCHES THAT NOTHING ELSE HERE DOES (measured 2026-09-12) ─────
//
// Against the 15 open PRs, on the MERGE result of each against `dev`, with
// `npm ci --legacy-peer-deps` then `next build` then `tsc` then `npm test`:
//
//   #262  @stripe/react-stripe-js -> @stripe/stripe-js@^1.44.1 || ^2 || ^3 || ^4
//         resolved to 9.15.0        build ✓  tsc ✓  test ✓
//   #263  @stripe/react-stripe-js -> @stripe/stripe-js@>=9.10.0 <10.0.0
//         resolved to 3.5.0         build ✓  tsc ✓  test ✓
//   #261  @stripe/react-stripe-js -> react@^16.8 || ^17 || ^18  (and react-dom)
//         resolved to 19.2.8        build ✓  tsc ✓  test ✓
//   #266  @mui/icons-material -> @mui/material@^5.0.0
//         resolved to 9.4.0         build ✗  (a separate, visible type error)
//   #267  @mui/icons-material -> @mui/material@^9.4.0
//         resolved to 5.18.0        build ✓  tsc ✓  test ✓
//
// Four of those five are GREEN on every check this repo has. #267's merge
// result installs, builds, typechecks and tests clean while shipping an icon
// package and a component package that disagree about a major version.
//
// #262/#263 and #266/#267 are PEER-LOCKED PAIRS — neither passes alone, both
// pass together. Applied together, `@stripe/stripe-js@^9.15.0` +
// `@stripe/react-stripe-js@^6.9.0` produce ZERO Stripe edges. Nothing in CI
// could say that before this file existed, which is why those PRs sat open
// with no verdict.
//
// Baseline on `dev` @ c54f050 after `npm ci --no-audit --legacy-peer-deps`:
// 890 installed packages, 3 unmet edges collapsing to 3 keys, all of them
// `eslint-config-next`'s nested `eslint-plugin-*` peering `eslint <= 9`
// against the `eslint@10.10.0` this repo installs. They are in the baseline
// with their owner and their retirement.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE KEY
// ═══════════════════════════════════════════════════════════════════════════
//
//     <owner> -> <name>@<spec> [<type>/<error>]
//
// `owner` is the TOP-LEVEL package the requiring node lives under
// (`node_modules/@babel/preset-env/node_modules/x/node_modules/y` -> owner
// `@babel/preset-env`), not the full nested path. Nested paths churn on every
// dedupe and would make the baseline unreadable (90 near-identical babel
// lines); the owner is what a human actually decides about. The RESOLVED
// version is deliberately not in the key — `react@19.2.8 -> 19.3.0` must not
// flip 5 baseline lines.
//
// ═══════════════════════════════════════════════════════════════════════════
// CONTROLS — AN EMPTY SCAN IS A FAILURE, NOT A PASS
// ═══════════════════════════════════════════════════════════════════════════
//
// A scan over zero nodes reports zero conflicts and looks clean. So the
// baseline carries `nodeFloor`, and a tree smaller than that fails outright:
// an uninstalled or half-installed tree has proven nothing. The PASS line
// prints the node count and the observed-conflict count for the same reason —
// a green run must show what it looked at.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Arborist comes from npm itself, so this script has no dependency of its own
// and can run in the `changes` job BEFORE node_modules exists (that is where
// the self-test runs). `npm root -g` is where npm lives on every runner and
// laptop; `--arborist` exists so the test can point at the same copy
// explicitly.
// ---------------------------------------------------------------------------
export function locateArborist(explicit) {
  const candidates = [];
  if (explicit) candidates.push(explicit);
  if (process.env.PEER_RATCHET_ARBORIST) candidates.push(process.env.PEER_RATCHET_ARBORIST);
  try {
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    candidates.push(path.join(globalRoot, 'npm', 'node_modules', '@npmcli', 'arborist'));
  } catch {
    /* fall through to the error below */
  }
  candidates.push('@npmcli/arborist');
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try the next one */
    }
  }
  throw new Error(
    `could not load @npmcli/arborist (tried: ${candidates.join(', ')}). ` +
      'It ships inside npm; pass --arborist <path> if npm is installed somewhere unusual.',
  );
}

/** `node_modules/@scope/name/node_modules/x` -> `@scope/name`; root -> `<root>` */
export function ownerOf(location) {
  if (!location) return '<root>';
  const parts = location.split('/');
  const i = parts.indexOf('node_modules');
  if (i === -1) return '<root>';
  const first = parts[i + 1];
  if (!first) return '<root>';
  return first.startsWith('@') ? `${first}/${parts[i + 2]}` : first;
}

export function keyOf(edge) {
  return `${edge.owner} -> ${edge.name}@${edge.spec} [${edge.type}/${edge.error}]`;
}

/** Every edge in the ACTUAL tree that arborist considers unmet. */
export async function collectUnmetEdges(Arborist, treePath) {
  // realpath: through a symlinked path (macOS /tmp, /var) arborist adds a
  // phantom link node for the path itself, which would count as an installed
  // package. Measured: an EMPTY tree scanned as 2 nodes until this.
  const arb = new Arborist({ path: fs.realpathSync(treePath) });
  const tree = await arb.loadActual();
  const edges = [];
  let installed = 0;
  for (const node of tree.inventory.values()) {
    if (!node.isRoot) installed += 1;
    for (const edge of node.edgesOut.values()) {
      if (edge.valid) continue;
      edges.push({
        owner: ownerOf(node.location),
        from: node.location || '<root>',
        name: edge.name,
        spec: edge.spec,
        type: edge.type,
        error: edge.error,
        resolved: edge.to ? edge.to.version : null,
        resolvedAt: edge.to ? edge.to.location : null,
      });
    }
  }
  // nodeCount = INSTALLED packages, root excluded; a bare package.json is 0.
  return { nodeCount: installed, edges };
}

export function readBaseline(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${file}: expected an object`);
  }
  if (!Number.isInteger(raw.nodeFloor) || raw.nodeFloor < 1) {
    throw new Error(`${file}: "nodeFloor" must be a positive integer (it is the control that an empty scan cannot pass)`);
  }
  if (typeof raw.entries !== 'object' || raw.entries === null || Array.isArray(raw.entries)) {
    throw new Error(`${file}: "entries" must be an object keyed by conflict`);
  }
  return raw;
}

/**
 * The decision. Pure, so the test can drive it and so the CLI cannot make a
 * different decision than the one under test.
 */
export function decide({ nodeCount, edges }, baseline) {
  const observed = new Map();
  for (const e of edges) {
    const k = keyOf(e);
    if (!observed.has(k)) observed.set(k, []);
    observed.get(k).push(e);
  }
  const known = new Set(Object.keys(baseline.entries));
  const fresh = [...observed.keys()].filter((k) => !known.has(k)).sort();
  const stale = [...known].filter((k) => !observed.has(k)).sort();
  const failures = [];
  // The root package is itself a node, so a tree with NO node_modules scans as
  // exactly one. That is never a pass, whatever the floor says.
  if (nodeCount < 1) {
    failures.push('the scanned tree contains no installed packages at all — nothing to check. Run this after `npm ci`.');
  } else if (nodeCount < baseline.nodeFloor) {
    failures.push(
      `the scanned tree has ${nodeCount} installed package(s), below the baseline floor of ${baseline.nodeFloor}. ` +
        'An uninstalled or partial tree reports no conflicts and proves nothing — run this after `npm ci`.',
    );
  }
  if (fresh.length) {
    failures.push(
      `${fresh.length} NEW unmet edge(s) not in the baseline — a dependency change introduced a conflict ` +
        'that --legacy-peer-deps is hiding:',
    );
    for (const k of fresh) {
      const ex = observed.get(k);
      failures.push(`    ${k}  (resolved: ${ex[0].resolved ?? 'nothing'}; ${ex.length} edge(s), e.g. from ${ex[0].from})`);
    }
  }
  if (stale.length) {
    failures.push(
      `${stale.length} baseline entr${stale.length === 1 ? 'y is' : 'ies are'} no longer observed — the conflict was ` +
        'resolved (good) — remove the entry from infra/ci/peer-conflict-baseline.json in this PR so the baseline stays honest:',
    );
    for (const k of stale) failures.push(`    ${k}`);
  }
  return { failures, observed, fresh, stale, nodeCount };
}

export function writeBaseline(file, { edges, nodeCount }, previous) {
  const entries = {};
  const keys = [...new Set(edges.map(keyOf))].sort();
  for (const k of keys) {
    const prev = previous && previous.entries && previous.entries[k];
    entries[k] = prev || { since: new Date().toISOString().slice(0, 10), note: 'TODO: why is this accepted, and what retires it?' };
  }
  const out = {
    $comment:
      'Unmet dependency edges this repository has decided to live with under --legacy-peer-deps. ' +
      'Read by infra/ci/peer-conflict-ratchet.mjs: any edge NOT here fails the build; any entry here that is no longer ' +
      'observed also fails until it is removed. Regenerate with `node infra/ci/peer-conflict-ratchet.mjs --write-baseline` ' +
      'and then WRITE THE NOTE — an entry without a reason is a conflict nobody decided about.',
    nodeFloor: previous && previous.nodeFloor ? previous.nodeFloor : Math.floor(nodeCount * 0.8),
    entries,
  };
  fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
  return out;
}

async function main(argv) {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
  let treePath = repoRoot;
  let baselineFile = path.join(repoRoot, 'infra', 'ci', 'peer-conflict-baseline.json');
  let arboristPath;
  let write = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tree') treePath = path.resolve(argv[++i]);
    else if (argv[i] === '--baseline') baselineFile = path.resolve(argv[++i]);
    else if (argv[i] === '--arborist') arboristPath = argv[++i];
    else if (argv[i] === '--write-baseline') write = true;
    else {
      console.error(`unknown argument ${JSON.stringify(argv[i])}`);
      return 2;
    }
  }

  let scan;
  try {
    const Arborist = locateArborist(arboristPath);
    scan = await collectUnmetEdges(Arborist, treePath);
  } catch (err) {
    console.error(`::error title=peer-conflict-ratchet could not scan::${err.message}`);
    return 1;
  }

  if (write) {
    let previous = null;
    try {
      previous = readBaseline(baselineFile);
    } catch {
      /* first write */
    }
    const out = writeBaseline(baselineFile, scan, previous);
    console.log(`wrote ${Object.keys(out.entries).length} entr(ies), nodeFloor=${out.nodeFloor}, to ${baselineFile}`);
    return 0;
  }

  let baseline;
  try {
    baseline = readBaseline(baselineFile);
  } catch (err) {
    console.error(`::error title=peer-conflict-ratchet cannot read its baseline::${err.message}`);
    return 1;
  }

  const result = decide(scan, baseline);
  console.log(
    `  scanned ${result.nodeCount} installed packages; ${scan.edges.length} unmet edge(s) collapsing to ${result.observed.size} key(s); ` +
      `baseline has ${Object.keys(baseline.entries).length}`,
  );
  if (result.failures.length) {
    console.log('  FAIL peer-conflict-ratchet');
    for (const f of result.failures) console.log(`    ${f}`);
    return 1;
  }
  console.log('  ok   peer-conflict-ratchet — no unmet edge outside the baseline, no stale baseline entry');
  return 0;
}

// realpath on BOTH sides: on macOS /tmp is a symlink to /private/tmp, and a
// plain path.resolve comparison silently never runs main() — exit 0, no
// output, a gate that reports green by never having looked. Measured.
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
