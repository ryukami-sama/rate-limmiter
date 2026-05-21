import request from 'supertest';
import { createApp } from '../src/createApp';
import { connectRedis, disconnectRedis, getRedis, resetRedisClient } from '../src/redis';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe.each([
  ['token-bucket', '/api/hello/token-bucket'],
  ['fixed-window', '/api/hello/fixed-window'],
] as const)('rateLimiter (%s)', (_algorithm, path) => {
  const maxRequests = 3;
  const windowMs = 1000;
  const app = createApp({ rateLimit: { maxRequests, windowMs } });

  beforeAll(async () => {
    process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
    resetRedisClient();
    await connectRedis();
  });

  beforeEach(async () => {
    await getRedis().flushdb();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  it('allows requests within the limit', async () => {
    for (let i = 0; i < maxRequests; i += 1) {
      const response = await request(app).get(path);
      expect(response.status).toBe(200);
    }
  });

  it('returns 429 when the limit is exceeded', async () => {
    for (let i = 0; i < maxRequests; i += 1) {
      await request(app).get(path);
    }

    const response = await request(app).get(path);
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Too Many Requests');
    expect(Number(response.body.retryAfter)).toBeGreaterThanOrEqual(1);
    expect(Number(response.body.resetAt)).toBeGreaterThan(0);
  });

  it('resets after the window expires', async () => {
    for (let i = 0; i < maxRequests; i += 1) {
      await request(app).get(path);
    }

    const blocked = await request(app).get(path);
    expect(blocked.status).toBe(429);

    await sleep(windowMs + 100);

    const response = await request(app).get(path);
    expect(response.status).toBe(200);
  });

  it('returns rate limit headers on successful requests', async () => {
    const response = await request(app).get(path);

    expect(response.status).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBe(String(maxRequests));
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
    expect(Number(response.headers['x-ratelimit-remaining'])).toBeLessThanOrEqual(maxRequests);
    expect(Number(response.headers['x-ratelimit-reset'])).toBeGreaterThan(0);
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('returns rate limit headers and Retry-After on 429 responses', async () => {
    for (let i = 0; i < maxRequests; i += 1) {
      await request(app).get(path);
    }

    const response = await request(app).get(path);

    expect(response.status).toBe(429);
    expect(response.headers['x-ratelimit-limit']).toBe(String(maxRequests));
    expect(response.headers['x-ratelimit-remaining']).toBe('0');
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
    expect(response.headers['retry-after']).toBeDefined();
    expect(Number(response.headers['retry-after'])).toBeGreaterThanOrEqual(1);
  });

  it('enforces the limit under concurrent requests', async () => {
    const responses = await Promise.all(
      Array.from({ length: maxRequests + 2 }, () => request(app).get(path)),
    );

    const allowed = responses.filter((response) => response.status === 200);
    const blocked = responses.filter((response) => response.status === 429);

    expect(allowed).toHaveLength(maxRequests);
    expect(blocked.length).toBeGreaterThanOrEqual(1);
  });
});
