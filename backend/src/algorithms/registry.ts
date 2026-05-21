import type { RateLimiterOptions, RateLimitResult } from '../types';
import { checkFixedWindow } from './fixedWindow';
import { checkTokenBucket, tokenBucketConfigFromWindow } from './tokenBucket';

export type RateLimitAlgorithm = {
  name: RateLimiterOptions['algorithm'];
  check: (key: string, options: RateLimiterOptions) => Promise<RateLimitResult>;
};

export const rateLimitAlgorithms: Record<RateLimiterOptions['algorithm'], RateLimitAlgorithm> = {
  'token-bucket': {
    name: 'token-bucket',
    check: async (key, options) => {
      const config = tokenBucketConfigFromWindow(options.maxRequests, options.windowMs);
      return checkTokenBucket(key, config, options.maxRequests);
    },
  },
  'fixed-window': {
    name: 'fixed-window',
    check: async (key, options) => checkFixedWindow(
      key,
      options.maxRequests,
      options.windowMs,
    ),
  },
};

export async function runRateLimitAlgorithm(
  key: string,
  options: RateLimiterOptions,
): Promise<RateLimitResult> {
  return rateLimitAlgorithms[options.algorithm].check(key, options);
}
