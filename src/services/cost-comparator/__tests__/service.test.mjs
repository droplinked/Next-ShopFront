/**
 * Tests for the cost-comparator service wrapper.
 *
 * Verifies:
 *  - happy-path round-trip with a $1M AWIN calc
 *  - error responses bubble as Error with the server-supplied message
 *  - empty/malformed error bodies fall back to status-code message
 *  - lead-capture posts to the right URL with the right body shape
 *
 * The TS source uses the global `fetch`. Here we inject a fake
 * `fetchImpl` so the runner doesn't need real networking.
 *
 * Runner: node --test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateService, leadCaptureService } from './service.mjs';

function makeResponse({ ok = true, status = 200, body = {} } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

function recordedFetch(response) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
  return { fetchImpl, calls };
}

// ---------- calculateService ----------

test('calculateService: posts to /api/cost-comparator/calculate', async () => {
  const { fetchImpl, calls } = recordedFetch(
    makeResponse({ body: { savingsAnnualUsd: 290_000 } }),
  );
  await calculateService(
    { currentNetwork: 'awin', annualSpendUsd: 1_000_000 },
    { fetchImpl },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/cost-comparator/calculate');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  const sent = JSON.parse(calls[0].init.body);
  assert.deepEqual(sent, {
    currentNetwork: 'awin',
    annualSpendUsd: 1_000_000,
  });
});

test('calculateService: returns parsed JSON on success', async () => {
  const { fetchImpl } = recordedFetch(
    makeResponse({ body: { savingsAnnualUsd: 290_000, foo: 'bar' } }),
  );
  const result = await calculateService(
    { currentNetwork: 'awin', annualSpendUsd: 1_000_000 },
    { fetchImpl },
  );
  assert.equal(result.savingsAnnualUsd, 290_000);
  assert.equal(result.foo, 'bar');
});

test('calculateService: throws with server-supplied error message on 4xx', async () => {
  const { fetchImpl } = recordedFetch(
    makeResponse({ ok: false, status: 400, body: { error: 'bad input' } }),
  );
  await assert.rejects(
    () =>
      calculateService(
        { currentNetwork: 'awin', annualSpendUsd: -1 },
        { fetchImpl },
      ),
    /bad input/,
  );
});

test('calculateService: throws with status-code message on empty error body', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 500,
    json: async () => { throw new Error('not json'); },
  });
  await assert.rejects(
    () =>
      calculateService(
        { currentNetwork: 'awin', annualSpendUsd: 1000 },
        { fetchImpl },
      ),
    /Request failed with status 500/,
  );
});

// ---------- leadCaptureService ----------

test('leadCaptureService: posts to /api/cost-comparator/lead-capture with full body', async () => {
  const { fetchImpl, calls } = recordedFetch(
    makeResponse({ body: { _id: 'lead_123', status: 'NEW' } }),
  );
  await leadCaptureService(
    {
      merchantEmail: 'cfo@brand.example.com',
      merchantName: 'Acme Brand Co',
      calcInput: { currentNetwork: 'awin', annualSpendUsd: 1_000_000 },
      verticalHint: 'apparel',
      utmSource: 'twitter-q2',
    },
    { fetchImpl },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/cost-comparator/lead-capture');
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.merchantEmail, 'cfo@brand.example.com');
  assert.equal(sent.merchantName, 'Acme Brand Co');
  assert.equal(sent.verticalHint, 'apparel');
  assert.equal(sent.utmSource, 'twitter-q2');
  assert.deepEqual(sent.calcInput, {
    currentNetwork: 'awin',
    annualSpendUsd: 1_000_000,
  });
});

test('leadCaptureService: returns lead response on success', async () => {
  const { fetchImpl } = recordedFetch(
    makeResponse({ body: { _id: 'lead_456', status: 'NEW' } }),
  );
  const result = await leadCaptureService(
    {
      merchantEmail: 'cfo@brand.example.com',
      merchantName: 'Acme Brand Co',
      calcInput: { currentNetwork: 'impact', annualSpendUsd: 500_000 },
    },
    { fetchImpl },
  );
  assert.equal(result._id, 'lead_456');
  assert.equal(result.status, 'NEW');
});

test('leadCaptureService: bubbles 429 rate-limit message', async () => {
  const { fetchImpl } = recordedFetch(
    makeResponse({
      ok: false,
      status: 429,
      body: { message: 'Too many requests' },
    }),
  );
  await assert.rejects(
    () =>
      leadCaptureService(
        {
          merchantEmail: 'cfo@brand.example.com',
          merchantName: 'Acme Brand Co',
          calcInput: { currentNetwork: 'awin', annualSpendUsd: 1000 },
        },
        { fetchImpl },
      ),
    /Too many requests/,
  );
});
