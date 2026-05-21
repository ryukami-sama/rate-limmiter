import request from 'supertest';
import { createApp } from '../src/createApp';
import { connectRedis, disconnectRedis, resetRedisClient } from '../src/redis';

describe('GET /api/health', () => {
  const app = createApp();

  beforeAll(async () => {
    process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
    resetRedisClient();
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  it('returns ok when Redis is reachable', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      redis: 'up',
    });
  });
});
