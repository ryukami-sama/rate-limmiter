export type Algorithm = 'token-bucket' | 'fixed-window';

export type KeyType = 'ip' | 'userId' | 'apiKey';

export type RateLimitStats = {
  limit: number;
  remaining: number;
  resetAt: number;
};

export type RateLimitResult = RateLimitStats & {
  allowed: boolean;
  retryAfter?: number;
};

export type RateLimitDeniedBody = {
  error: string;
  retryAfter?: number;
  resetAt: number;
};

export type HealthResponse = {
  status: 'ok' | 'degraded';
  redis?: 'up' | 'down';
};

export type HelloResponse = {
  message: string;
};
