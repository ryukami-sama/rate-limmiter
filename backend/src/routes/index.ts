import type { Express } from 'express';
import type { RateLimitConfig } from '../config';
import { createHelloRoutes } from './hello.route';
import { healthRouter } from './health.route';

export function registerRoutes(app: Express, overrides?: Partial<RateLimitConfig>): void {
  const helloRoutes = createHelloRoutes(overrides);

  app.use('/api', healthRouter);
  app.use('/api/hello/token-bucket', helloRoutes.tokenBucket);
  app.use('/api/hello/fixed-window', helloRoutes.fixedWindow);
}
