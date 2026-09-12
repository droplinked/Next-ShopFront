#!/usr/bin/env node
// Asserts the shop-home indexability rule ON THE RENDERED HTML of a REAL
// `next start` server, not on the module that computes it. Next-ShopFront#298.
//
//     node infra/ci/rendered-robots-probe.mjs            # after `npm run build`
//     node infra/ci/rendered-robots-probe.mjs --self-test # + the mutations
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY A SECOND CONTROL OVER THE SAME RULE
// ═══════════════════════════════════════════════════════════════════════════
//
// `src/__smoke__/shop-home-indexability.smoke.test.mjs` already exercises
// `shopHomeRobots` exhaustively — and it would stay green through every one of
// these failures, because it never renders a page:
//
//   • a Next major changes how `Metadata.robots` SERIALISES (`noindex, follow`
//     -> `noindex,follow`, or the directive moving to a header);
//   • `generateMetadata` stops being called for this route, or its result stops
//     reaching the document, so the page inherits the ROOT robots instead;
//   • the shop branch stops resolving and every handle falls through to the
//     product branch, which returns `{}` — no robots meta at all;
//   • someone deletes the `robots:` key from the returned object.
//
// Each of those ships a storefront that indexes a customer's email address
// while every test in the repository passes. 2026-09-12: Next 15 -> 16 is
// exactly the change that could do it, which is why this exists now.
//
// ── WHAT IT MEASURES ──────────────────────────────────────────────────────
// A fixture apiv3 on an ephemeral port (the `APIV3_BASE_URL` seam that
// `shop-home-data.ts` already reads), a real `next start` against the build in
// `.next`, and an HTTP GET per case whose RESPONSE BODY is searched for the
// robots meta tag. Nothing is imported from the app.
//
// ── THE FOUR CASES, AND WHY EACH IS LOAD-BEARING ──────────────────────────
//   email-stocked   handle IS an address, 2 products -> noindex, follow
//                   The privacy condition must not care about stock. This is
//                   the case a "thin page" reading of the rule gets wrong.
//   control-stocked ordinary handle,      2 products -> index,  follow
//                   🚨 THE CLEAN CASE. Without it a probe that emitted
//                   `noindex` for EVERYTHING would pass.
//   empty-counted   ordinary handle, counted zero    -> noindex, follow
//   list-404        ordinary handle, product list 404 (catalog UNCOUNTED)
//                                                    -> index,  follow
//                   🚨 FAIL-OPEN. An uncounted catalogue must never delist a
//                   shop; this is the 2026-09-08 throttle class, asserted on
//                   the artifact rather than on the module's docstring.
//
// ── THE MUTATIONS (`--self-test`) ─────────────────────────────────────────
// A probe that cannot fail proves nothing, so `--self-test` re-runs each case
// against a DELIBERATELY WRONG expectation and requires the probe to report
// failure, then runs one case against HTML with the meta tag stripped and
// requires that to fail too. It reports how many mutations it killed; a run
// that kills fewer than it launched is itself a failure.

import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

// ---------------------------------------------------------------------------
// Fixture apiv3. Only the two endpoints `fetchShopHome` calls.
// ---------------------------------------------------------------------------

/** handle -> { products: n } | { list404: true } */
const SHOPS = {
  'yg300211@gmail.com': { products: 2 },
  'control-stocked-shop': { products: 2 },
  'empty-counted-shop': { products: 0 },
  'list-404-shop': { list404: true },
};

function storeBody(handle) {
  return {
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: `Fixture ${handle}`,
    },
    openGraph: {},
  };
}

function listBody(n, handle) {
  const data = Array.from({ length: n }, (_, i) => ({
    id: `${i}`.padStart(24, '0'),
    title: `Fixture product ${i}`,
    slug: `fixture-product-${i}`,
    images: [{ thumbnail: null, original: null }],
    lowestPrice: 10 + i,
  }));
  return { statusCode: 200, message: handle, data: { data, totalDocuments: n, totalPages: 1 } };
}

function startFixtureApi() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      const store = /^\/shop\/(.+)\/structured-data$/.exec(url.pathname);
      const list = /^\/product-v2\/public\/shop\/(.+)$/.exec(url.pathname);
      const send = (code, body) => {
        res.writeHead(code, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };
      if (store) {
        const handle = decodeURIComponent(store[1]);
        if (!SHOPS[handle]) return send(404, { message: 'no such shop' });
        return send(200, storeBody(handle));
      }
      if (list) {
        const handle = decodeURIComponent(list[1]);
        const shop = SHOPS[handle];
        if (!shop) return send(404, { message: 'no such shop' });
        if (shop.list404) return send(404, { message: 'no list' });
        return send(200, listBody(shop.products, handle));
      }
      send(404, { message: 'unhandled' });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// ---------------------------------------------------------------------------
// The app under test: a real `next start` over the real build.
// ---------------------------------------------------------------------------

async function startApp(apiPort, port) {
  const bin = path.join(REPO_ROOT, 'node_modules', '.bin', 'next');
  if (!fs.existsSync(bin)) throw new Error(`${bin} is missing — run npm ci first`);
  if (!fs.existsSync(path.join(REPO_ROOT, '.next'))) {
    throw new Error('.next is missing — this probe measures the BUILT output; run `npm run build` first');
  }
  const child = spawn(bin, ['start', '--port', String(port), '--hostname', '127.0.0.1'], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      APIV3_BASE_URL: `http://127.0.0.1:${apiPort}`,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });

  const deadline = Date.now() + 90_000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`next start exited ${child.exitCode}:\n${log}`);
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (r.status) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`next start did not answer in 90s:\n${log}`);
    await new Promise((r) => setTimeout(r, 400));
  }
  return { child, log: () => log };
}

// ---------------------------------------------------------------------------
// The assertion. Pure over (html) so the mutations can drive it directly.
// ---------------------------------------------------------------------------

/** The robots directive as the DOCUMENT states it, or null when absent. */
export function robotsFromHtml(html) {
  const m = /<meta[^>]+name="robots"[^>]*>/i.exec(html);
  if (!m) return null;
  const c = /content="([^"]*)"/i.exec(m[0]);
  return c ? c[1].trim() : null;
}

/** `noindex, follow` and `noindex,follow` are the same directive. */
export function normaliseDirective(value) {
  if (typeof value !== 'string') return null;
  return value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).sort().join(',');
}

export function judge({ html, expect: want }) {
  const raw = robotsFromHtml(html);
  if (raw === null) {
    return { ok: false, raw, detail: 'no <meta name="robots"> in the rendered document at all' };
  }
  const got = normaliseDirective(raw);
  const expected = normaliseDirective(want);
  return { ok: got === expected, raw, detail: `rendered ${JSON.stringify(raw)}, expected ${JSON.stringify(want)}` };
}

const CASES = [
  { name: 'email-stocked  ', handle: 'yg300211@gmail.com', expect: 'noindex, follow' },
  { name: 'control-stocked', handle: 'control-stocked-shop', expect: 'index, follow' },
  { name: 'empty-counted  ', handle: 'empty-counted-shop', expect: 'noindex, follow' },
  { name: 'list-404       ', handle: 'list-404-shop', expect: 'index, follow' },
];

async function main(argv) {
  const selfTest = argv.includes('--self-test');
  const api = await startFixtureApi();
  const appPort = 3000 + Math.floor(Math.random() * 2000);
  let app;
  try {
    app = await startApp(api.port, appPort);
  } catch (err) {
    api.server.close();
    console.error(`::error title=rendered-robots-probe could not start the app::${err.message}`);
    return 1;
  }

  const results = [];
  let failed = 0;
  try {
    for (const c of CASES) {
      const url = `http://127.0.0.1:${appPort}/${encodeURIComponent(c.handle)}`;
      const res = await fetch(url, { headers: { accept: 'text/html' } });
      const html = await res.text();
      const verdict = judge({ html, expect: c.expect });
      results.push({ c, html, verdict, status: res.status });
      const mark = verdict.ok && res.status === 200 ? 'ok  ' : 'FAIL';
      if (!verdict.ok || res.status !== 200) failed += 1;
      console.log(`  ${mark} ${c.name}  /${c.handle}  HTTP ${res.status}  robots=${JSON.stringify(verdict.raw)}`);
    }

    // ── the empty scan control ────────────────────────────────────────────
    // Four cases must have been MEASURED. A loop that ran zero times prints
    // no failures and would otherwise read as a pass.
    if (results.length !== CASES.length) {
      console.log(`  FAIL only ${results.length} of ${CASES.length} cases were measured`);
      failed += 1;
    }
    // Both answers must appear. A server that emitted `noindex` for every page
    // would satisfy two cases and is not a working rule.
    const seen = new Set(results.map((r) => normaliseDirective(r.verdict.raw)));
    if (seen.size < 2) {
      console.log(`  FAIL every case rendered the same directive (${[...seen]}) — the rule is not discriminating`);
      failed += 1;
    }

    if (selfTest) {
      let launched = 0;
      let killed = 0;
      for (const r of results) {
        launched += 1;
        const wrong = r.c.expect === 'index, follow' ? 'noindex, follow' : 'index, follow';
        if (!judge({ html: r.html, expect: wrong }).ok) killed += 1;
      }
      launched += 1;
      const stripped = results[0].html.replace(/<meta[^>]+name="robots"[^>]*>/gi, '');
      if (!judge({ html: stripped, expect: results[0].c.expect }).ok) killed += 1;
      launched += 1;
      if (!judge({ html: '', expect: 'index, follow' }).ok) killed += 1;
      console.log(`  mutations: ${killed} of ${launched} killed`);
      if (killed !== launched) {
        console.log('  FAIL the probe survived a mutation — it cannot detect the regression it exists for');
        failed += 1;
      }
    }
  } finally {
    app.child.kill('SIGTERM');
    api.server.close();
  }

  if (failed) {
    console.log(`  FAIL rendered-robots-probe — ${failed} failing check(s)`);
    return 1;
  }
  console.log(`  ok   rendered-robots-probe — ${CASES.length} case(s) asserted on rendered HTML from \`next start\``);
  return 0;
}

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
