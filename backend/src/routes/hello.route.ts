import { Router } from 'express';
import type { Algorithm } from '@rate-limiter/shared';
import { resolveRateLimitConfig, type RateLimitConfig } from '../config';
import { createRateLimiter } from '../middleware/rateLimiter';
import type { RateLimiterOptions } from '../types';

function buildRateLimitOptions(
  algorithm: Algorithm,
  overrides?: Partial<RateLimitConfig>,
): RateLimiterOptions {
  const { maxRequests, windowMs } = resolveRateLimitConfig(overrides);

  return {
    algorithm,
    maxRequests,
    windowMs,
    keyType: 'ip',
  };
}

function createHelloRouter(options: RateLimiterOptions) {
  const router = Router();

  router.get('/', createRateLimiter(options), (_req, res) => {
    res.json({ message: `Hello from ${options.algorithm}` });
  });

  return router;
}

export function createHelloRoutes(overrides?: Partial<RateLimitConfig>) {
  return {
    tokenBucket: createHelloRouter(buildRateLimitOptions('token-bucket', overrides)),
    fixedWindow: createHelloRouter(buildRateLimitOptions('fixed-window', overrides)),
  };
}
