import { parseLuaRateLimitResult } from './parseResult';
import { getRedis } from '../redis';
import type { LuaRateLimitTuple } from '../types';

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refillRate = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  lastRefill = now
end

local elapsed = math.max(0, now - lastRefill)
tokens = math.min(capacity, tokens + (elapsed * refillRate))

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

local remaining = math.floor(tokens)
local deficit = capacity - tokens
local msToFull = 0
if deficit > 0 and refillRate > 0 then
  msToFull = math.ceil(deficit / refillRate)
end
local resetAtMs = now + msToFull
local ttlSeconds = math.max(1, math.ceil(msToFull / 1000) + 1)

redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
redis.call('EXPIRE', key, ttlSeconds)

local retryAfter = 0
if allowed == 0 and refillRate > 0 then
  retryAfter = math.max(1, math.ceil((1 - tokens) / refillRate / 1000))
end

return { allowed, remaining, resetAtMs, retryAfter }
`;

export type TokenBucketConfig = {
  capacity: number;
  refillRate: number;
};

export async function checkTokenBucket(
  key: string,
  bucketConfig: TokenBucketConfig,
  limit: number,
): Promise<ReturnType<typeof parseLuaRateLimitResult>> {
  const redis = getRedis();
  const now = Date.now();

  const result = await redis.eval(
    TOKEN_BUCKET_SCRIPT,
    1,
    `rate:tb:${key}`,
    now,
    bucketConfig.capacity,
    bucketConfig.refillRate,
  ) as LuaRateLimitTuple;

  return parseLuaRateLimitResult(result, limit);
}

export function tokenBucketConfigFromWindow(maxRequests: number, windowMs: number): TokenBucketConfig {
  return {
    capacity: maxRequests,
    refillRate: maxRequests / windowMs,
  };
}
