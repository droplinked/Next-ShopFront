/**
 * Page-level test: verifies the API proxy forwards correctly to the
 * upstream backend (droplinked-backend cost-comparator endpoints).
 *
 * Mocks the upstream fetch so the runner doesn't need real networking.
 * Re-uses the proxy-logic twin in proxy.mjs.
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { proxyPost } from './proxy.mjs';

function makeUpstream({ ok = true, status = 200, text = '{}' } = {}) {
  return {
    ok,
    status,
    text: async () => text,
  };
}

function recordFetch(response) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
  return { fetchImpl, calls };
}

// ---------- BASE_API_URL guard ----------

test('proxy: returns 500 when baseApiUrl is undefined', async () => {
  const result = await proxyPost({
    upstreamUrl: 'cost-comparator/calculate',
    baseApiUrl: undefined,
    body: { currentNetwork: 'awin', annualSpendUsd: 1_000_000 },
    fetchImpl: async () => makeUpstream(),
  });
  assert.equal(result.status, 500);
  assert.match(result.body.error, /backend URL not configured/i);
});

// ---------- happy path (calculate) ----------

test('proxy: forwards POST /cost-comparator/calculate body verbatim', async () => {
  const upstreamBody = {
    savingsAnnualUsd: 290_000,
    savings3YearUsd: 870_000,
    payoutSpeedComparison: { speedMultiplier: 1_127_586.21 },
  };
  const { fetchImpl, calls } = recordFetch(
    makeUpstream({ text: JSON.stringify(upstreamBody) }),
  );
  const result = await proxyPost({
    upstreamUrl: 'cost-comparator/calculate',
    baseApiUrl: 'https://api.example.com/',
    body: { currentNetwork: 'awin', annualSpendUsd: 1_000_000 },
    fetchImpl,
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, upstreamBody);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.example.com/cost-comparator/calculate',
  );
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  const sent = JSON.parse(calls[0].init.body);
  assert.deepEqual(sent, {
    currentNetwork: 'awin',
    annualSpendUsd: 1_000_000,
  });
});

// ---------- x-forwarded-for forwarding ----------

test('proxy: forwards x-forwarded-for header for upstream rate-limit keying', async () => {
  const { fetchImpl, calls } = recordFetch(makeUpstream({ text: '{}' }));
  await proxyPost({
    upstreamUrl: 'cost-comparator/calculate',
    baseApiUrl: 'https://api.example.com/',
    body: {},
    forwardedFor: '203.0.113.42',
    fetchImpl,
  });
  assert.equal(calls[0].init.headers['x-forwarded-for'], '203.0.113.42');
});

test('proxy: omits x-forwarded-for when not provided', async () => {
  const { fetchImpl, calls } = recordFetch(makeUpstream({ text: '{}' }));
  await proxyPost({
    upstreamUrl: 'cost-comparator/calculate',
    baseApiUrl: 'https://api.example.com/',
    body: {},
    fetchImpl,
  });
  assert.equal(calls[0].init.headers['x-forwarded-for'], undefined);
});

// ---------- error pass-through ----------

test('proxy: relays upstream 400 with body in error envelope', async () => {
  const { fetchImpl } = recordFetch(
    makeUpstream({
      ok: false,
      status: 400,
      text: '{"error":"avgCommissionRate must be between 0 and 1"}',
    }),
  );
  const result = await proxyPost({
    upstreamUrl: 'cost-comparator/calculate',
    baseApiUrl: 'https://api.example.com/',
    body: { currentNetwork: 'awin', annualSpendUsd: 1000, avgCommissionRate: 5 },
    fetchImpl,
  });
  assert.equal(result.status, 400);
  assert.match(result.body.error, /avgCommissionRate/);
});

test('proxy: relays upstream 429 rate-limit', async () => {
  const { fetchImpl } = recordFetch(
    makeUpstream({ ok: false, status: 429, text: 'rate limit exceeded' }),
  );
  const result = await proxyPost({
    upstreamUrl: 'cost-comparator/lead-capture',
    baseApiUrl: 'https://api.example.com/',
    body: { merchantEmail: 'a@b.com', merchantName: 'x', calcInput: {} },
    fetchImpl,
  });
  assert.equal(result.status, 429);
  assert.equal(result.body.error, 'rate limit exceeded');
});

test('proxy: catches transport failure → 500 with cause message', async () => {
  const fetchImpl = async () => {
    throw new Error('upstream connection refused');
  };
  const result = await proxyPost({
    upstreamUrl: 'cost-comparator/calculate',
    baseApiUrl: 'https://api.example.com/',
    body: {},
    fetchImpl,
  });
  assert.equal(result.status, 500);
  assert.match(result.body.error, /upstream connection refused/);
});
