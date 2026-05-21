import type { Algorithm, RateLimitStats } from '@rate-limiter/shared';

export type { Algorithm, RateLimitStats };
export type { RateLimitDeniedBody as RateLimitErrorBody } from '@rate-limiter/shared';

export type RequestStatusKind = 'success' | 'rate_limited' | 'unavailable' | 'error';

export type LogEntry = {
  id: string;
  timestamp: string;
  status: number;
  statusKind: RequestStatusKind;
  algorithm: Algorithm;
  retryAfter?: number;
  error?: string;
};

export type RequestOutcome = {
  stats: RateLimitStats | null;
  status: number;
  statusKind: RequestStatusKind;
  retryAfter?: number;
  resetAt?: number;
};

export type DemoState = {
  stats: RateLimitStats | null;
  countdownTarget: number | null;
  countdownMode: 'retry' | 'reset';
};

export type HealthStatus = {
  healthy: boolean;
  redis?: 'up' | 'down';
};
