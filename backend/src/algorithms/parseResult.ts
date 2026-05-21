import type { LuaRateLimitTuple, RateLimitResult } from '../types';

export function parseLuaRateLimitResult(
  result: LuaRateLimitTuple,
  limit: number,
): RateLimitResult {
  const [allowed, remaining, resetAtMs, retryAfter] = result;

  return {
    allowed: allowed === 1,
    limit,
    remaining,
    resetAt: Math.ceil(resetAtMs / 1000),
    retryAfter: allowed === 1 ? undefined : Math.max(1, retryAfter),
  };
}
