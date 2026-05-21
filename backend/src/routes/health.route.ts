import { Router } from 'express';
import type { HealthResponse } from '@rate-limiter/shared';
import { pingRedis } from '../redis';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const redisHealthy = await pingRedis();

  if (!redisHealthy) {
    const body: HealthResponse = {
      status: 'degraded',
      redis: 'down',
    };
    res.status(503).json(body);
    return;
  }

  const body: HealthResponse = {
    status: 'ok',
    redis: 'up',
  };
  res.json(body);
});
