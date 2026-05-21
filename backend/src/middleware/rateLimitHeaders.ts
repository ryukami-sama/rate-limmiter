import type { Response } from 'express';
import { RATE_LIMIT_HEADERS } from '../constants';
import type { RateLimitResult } from '../types';

export function setRateLimitHeaders(res: Response, result: RateLimitResult): void {
  res.setHeader(RATE_LIMIT_HEADERS.limit, String(result.limit));
  res.setHeader(RATE_LIMIT_HEADERS.remaining, String(result.remaining));
  res.setHeader(RATE_LIMIT_HEADERS.reset, String(result.resetAt));

  if (!result.allowed && result.retryAfter !== undefined) {
    res.setHeader(RATE_LIMIT_HEADERS.retryAfter, String(result.retryAfter));
  }
}
