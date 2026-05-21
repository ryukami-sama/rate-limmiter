import express, { type Express } from 'express';
import type { RateLimitConfig } from './config';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { attachRequestId, notFoundHandler, requestLogger } from './middleware/http';
import { registerRoutes } from './routes';

export type AppOptions = {
  rateLimit?: Partial<RateLimitConfig>;
};

export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(attachRequestId);
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(requestLogger);

  registerRoutes(app, options.rateLimit);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
