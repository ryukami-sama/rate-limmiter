import type { Algorithm, KeyType, RateLimitResult } from '@rate-limiter/shared';

export type { Algorithm, KeyType, RateLimitResult };
export type { RateLimitDeniedBody, RateLimitStats } from '@rate-limiter/shared';

export type RateLimiterOptions = {
  algorithm: Algorithm;
  maxRequests: number;
  windowMs: number;
  keyType?: KeyType;
  keyHeader?: string;
};

export type LuaRateLimitTuple = [number, number, number, number];
