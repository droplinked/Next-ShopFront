/**
 * Typed wrapper around the local Next.js API-route proxies for the
 * cost-comparator backend (droplinked-backend PR #1450).
 *
 * Components import these instead of calling `fetch` directly so the
 * URLs and response shapes have a single source of truth.
 *
 * Network-level failures (CORS, DNS, 5xx) bubble as `Error`s with the
 * server-supplied message so the calling component can surface them
 * inline. Validation failures (4xx) also bubble as `Error`s — the
 * caller is responsible for client-side validation via
 * `validateCalculatorInput` / `validateLeadCaptureInput` to avoid
 * the round-trip on obvious cases.
 */

import type {
  CalculateInput,
  CalculateOutput,
  LeadCaptureInput,
  LeadCaptureResponse,
} from '@/lib/cost-comparator/types';

async function readError(response: Response): Promise<string> {
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

export async function calculateService(
  input: CalculateInput,
): Promise<CalculateOutput> {
  const response = await fetch('/api/cost-comparator/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<CalculateOutput>;
}

export async function leadCaptureService(
  input: LeadCaptureInput,
): Promise<LeadCaptureResponse> {
  const response = await fetch('/api/cost-comparator/lead-capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<LeadCaptureResponse>;
}
