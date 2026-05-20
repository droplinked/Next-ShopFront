import { NextResponse } from 'next/server'
import { dispatch, type ToolInput } from '../dispatcher'

/**
 * MCP tool route — thin transport wrapper around `dispatch()`.
 *
 * Rate limit header is currently a stub (always reports a fixed remaining
 * count). The real per-IP/per-key limiter lands with sidekick's framework;
 * this header lets MCP clients start parsing it now so the contract is
 * stable when the real limiter ships.
 */

const RATE_LIMIT_PER_MINUTE = 60

function rateLimitHeaders(): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_PER_MINUTE),
    // Stub: real limiter will compute this per caller. Reporting the limit
    // itself is a safe placeholder until sidekick's framework lands.
    'X-RateLimit-Remaining': String(RATE_LIMIT_PER_MINUTE),
    'X-RateLimit-Policy': 'stub; real limiter pending sidekick framework',
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool } = await params
  let input: ToolInput = {}
  try {
    const parsed = await request.json()
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      input = parsed as ToolInput
    }
  } catch {
    // Empty / non-JSON body → treat as empty input. Validators below decide
    // whether that's acceptable for the targeted tool.
  }

  const outcome = await dispatch(tool, input)
  return NextResponse.json(outcome.body, {
    status: outcome.status,
    headers: rateLimitHeaders(),
  })
}
