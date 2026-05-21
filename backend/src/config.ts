import { RATE_LIMIT_DEFAULTS } from './constants';

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN ?? '*';

if (isProduction && corsOrigin === '*') {
  console.warn(
    JSON.stringify({
      event: 'config_warning',
      message: 'CORS_ORIGIN is set to * in production. Configure an explicit origin.',
    }),
  );
}

export const config = {
  port: readNumber(process.env.PORT, 3001),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  corsOrigin,
  rateLimit: {
    maxRequests: readNumber(process.env.RATE_LIMIT_MAX, RATE_LIMIT_DEFAULTS.maxRequests),
    windowMs: readNumber(process.env.RATE_LIMIT_WINDOW_MS, RATE_LIMIT_DEFAULTS.windowMs),
  },
  isProduction,
} as const;

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

export function resolveRateLimitConfig(overrides?: Partial<RateLimitConfig>): RateLimitConfig {
  return {
    maxRequests: overrides?.maxRequests ?? config.rateLimit.maxRequests,
    windowMs: overrides?.windowMs ?? config.rateLimit.windowMs,
  };
}
