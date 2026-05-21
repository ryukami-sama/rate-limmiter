import type { HealthResponse, RateLimitDeniedBody } from '@rate-limiter/shared';
import { API_ROUTES, RATE_LIMIT_HEADERS } from '@rate-limiter/shared';
import { getApiUrl } from './config';
import type {
  Algorithm,
  HealthStatus,
  RateLimitStats,
  RequestOutcome,
  RequestStatusKind,
} from './types';

export class ApiRequestError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function classifyStatus(status: number): RequestStatusKind {
  if (status === 200) {
    return 'success';
  }

  if (status === 429) {
    return 'rate_limited';
  }

  if (status === 503) {
    return 'unavailable';
  }

  return 'error';
}

function parseRateLimitHeaders(response: Response): RateLimitStats | null {
  const limitHeader = response.headers.get(RATE_LIMIT_HEADERS.limit);
  const remainingHeader = response.headers.get(RATE_LIMIT_HEADERS.remaining);
  const resetHeader = response.headers.get(RATE_LIMIT_HEADERS.reset);

  if (!limitHeader || !remainingHeader || !resetHeader) {
    return null;
  }

  const limit = Number(limitHeader);
  const remaining = Number(remainingHeader);
  const resetAt = Number(resetHeader);

  if (!Number.isFinite(limit) || !Number.isFinite(remaining) || !Number.isFinite(resetAt)) {
    return null;
  }

  return { limit, remaining, resetAt };
}

function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers.get(RATE_LIMIT_HEADERS.retryAfter);
  if (!header) {
    return undefined;
  }

  const value = Number(header);
  return Number.isFinite(value) ? value : undefined;
}

async function parseRateLimitErrorBody(response: Response): Promise<RateLimitDeniedBody | null> {
  if (response.status !== 429) {
    return null;
  }

  try {
    return await response.clone().json() as RateLimitDeniedBody;
  } catch {
    return null;
  }
}

function buildOutcome(
  response: Response,
  stats: RateLimitStats | null,
  errorBody: RateLimitDeniedBody | null,
): RequestOutcome {
  const status = response.status;
  const retryAfter = parseRetryAfter(response) ?? errorBody?.retryAfter;

  return {
    stats,
    status,
    statusKind: classifyStatus(status),
    retryAfter,
    resetAt: stats?.resetAt ?? errorBody?.resetAt,
  };
}

export async function sendRateLimitedRequest(algorithm: Algorithm): Promise<RequestOutcome> {
  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${API_ROUTES.hello(algorithm)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    throw new ApiRequestError('Unable to reach the API', error);
  }

  const stats = parseRateLimitHeaders(response);
  const errorBody = await parseRateLimitErrorBody(response);

  return buildOutcome(response, stats, errorBody);
}

export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${getApiUrl()}${API_ROUTES.health}`, { cache: 'no-store' });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as HealthResponse | null;
      return { healthy: false, redis: body?.redis };
    }

    const body = await response.json() as HealthResponse;
    return { healthy: true, redis: body.redis };
  } catch {
    return { healthy: false };
  }
}
