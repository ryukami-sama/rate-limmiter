import type { Algorithm } from './types';

export const RATE_LIMIT_HEADERS = {
  limit: 'X-RateLimit-Limit',
  remaining: 'X-RateLimit-Remaining',
  reset: 'X-RateLimit-Reset',
  retryAfter: 'Retry-After',
} as const;

export const RATE_LIMIT_DEFAULTS = {
  maxRequests: 10,
  windowMs: 60_000,
} as const;

export const ALGORITHMS: Array<{ value: Algorithm; label: string }> = [
  { value: 'token-bucket', label: 'Token bucket' },
  { value: 'fixed-window', label: 'Fixed window' },
];

export const API_ROUTES = {
  health: '/api/health',
  hello: (algorithm: Algorithm) => `/api/hello/${algorithm}`,
} as const;

export function getAlgorithmLabel(algorithm: Algorithm): string {
  return ALGORITHMS.find((item) => item.value === algorithm)?.label ?? algorithm;
}

export function isAlgorithm(value: string): value is Algorithm {
  return ALGORITHMS.some((item) => item.value === value);
}

export function parseAlgorithm(value: string | null): Algorithm | null {
  if (!value || !isAlgorithm(value)) {
    return null;
  }

  return value;
}
