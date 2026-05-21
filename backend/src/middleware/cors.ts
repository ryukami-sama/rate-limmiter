import cors from 'cors';
import { RATE_LIMIT_HEADERS } from '@rate-limiter/shared';
import { config } from '../config';

export const corsMiddleware = cors({
  origin: config.corsOrigin,
  exposedHeaders: [
    RATE_LIMIT_HEADERS.limit,
    RATE_LIMIT_HEADERS.remaining,
    RATE_LIMIT_HEADERS.reset,
    RATE_LIMIT_HEADERS.retryAfter,
  ],
});
