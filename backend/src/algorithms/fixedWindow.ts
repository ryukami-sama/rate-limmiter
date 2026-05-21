import { parseLuaRateLimitResult } from './parseResult';
import { getRedis } from '../redis';
import type { LuaRateLimitTuple, RateLimitResult } from '../types';

const FIXED_WINDOW_SCRIPT = `
local key = KEYS[1]
local maxRequests = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local windowStart = math.floor(now / windowMs) * windowMs
local windowKey = key .. ':' .. windowStart
local resetAtMs = windowStart + windowMs

local count = redis.call('INCR', windowKey)
if count == 1 then
  local ttlMs = resetAtMs - now
  local ttlSeconds = math.max(1, math.ceil(ttlMs / 1000) + 1)
  redis.call('EXPIRE', windowKey, ttlSeconds)
end

local allowed = 0
if count <= maxRequests then
  allowed = 1
end

local remaining = math.max(0, maxRequests - count)
local retryAfter = 0
if allowed == 0 then
  retryAfter = math.max(1, math.ceil((resetAtMs - now) / 1000))
end

return { allowed, remaining, resetAtMs, retryAfter }
`;

export async function checkFixedWindow(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();

  const result = await redis.eval(
    FIXED_WINDOW_SCRIPT,
    1,
    `rate:fw:${key}`,
    maxRequests,
    windowMs,
    now,
  ) as LuaRateLimitTuple;

  return parseLuaRateLimitResult(result, maxRequests);
}
