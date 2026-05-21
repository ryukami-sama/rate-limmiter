import { parseLuaRateLimitResult } from '../src/algorithms/parseResult';

describe('parseLuaRateLimitResult', () => {
  it('maps allowed responses', () => {
    expect(parseLuaRateLimitResult([1, 9, 1_700_000_000_000, 0], 10)).toEqual({
      allowed: true,
      limit: 10,
      remaining: 9,
      resetAt: 1_700_000_000,
      retryAfter: undefined,
    });
  });

  it('maps denied responses with retry metadata', () => {
    expect(parseLuaRateLimitResult([0, 0, 1_700_000_005_000, 5], 10)).toEqual({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: 1_700_000_005,
      retryAfter: 5,
    });
  });
});
