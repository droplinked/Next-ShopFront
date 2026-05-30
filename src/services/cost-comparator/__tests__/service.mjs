/**
 * Pure JS twin of src/services/cost-comparator/service.ts — the
 * fetch wrapper. Mirrors the TS source so the test runner can
 * exercise the same error-handling shape without TS compilation.
 *
 * Inject `fetchImpl` to swap in a recorder. Keep in lockstep with
 * the TS source.
 */

async function readError(response) {
  try {
    const data = await response.json();
    if (data && typeof data === 'object' && 'error' in data) {
      return String(data.error);
    }
    if (data && typeof data === 'object' && 'message' in data) {
      return String(data.message);
    }
    return `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function calculateService(input, { fetchImpl } = {}) {
  const f = fetchImpl ?? globalThis.fetch;
  const response = await f('/api/cost-comparator/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function leadCaptureService(input, { fetchImpl } = {}) {
  const f = fetchImpl ?? globalThis.fetch;
  const response = await f('/api/cost-comparator/lead-capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}
