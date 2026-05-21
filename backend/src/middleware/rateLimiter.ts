import type { NextFunction, Request, Response } from 'express';
import { runRateLimitAlgorithm } from '../algorithms/registry';
import { ServiceUnavailableError } from '../errors';
import { isRedisUnavailableError } from '../redis';
import type { RateLimiterOptions } from '../types';
import { extractRateLimitKey } from './extractKey';
import { setRateLimitHeaders } from './rateLimitHeaders';

export async function checkRateLimit(
  key: string,
  options: RateLimiterOptions,
): Promise<Awaited<ReturnType<typeof runRateLimitAlgorithm>>> {
  return runRateLimitAlgorithm(key, options);
}

export function createRateLimiter(options: RateLimiterOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = extractRateLimitKey(req, options);
      const result = await checkRateLimit(key, options);

      setRateLimitHeaders(res, result);

      if (!result.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: result.retryAfter,
          resetAt: result.resetAt,
        });
        return;
      }

      next();
    } catch (error) {
      if (isRedisUnavailableError(error)) {
        next(new ServiceUnavailableError());
        return;
      }

      next(error);
    }
  };
}
