export { RATE_LIMIT_DEFAULTS, RATE_LIMIT_HEADERS } from '@rate-limiter/shared';

export const DEMO_LIMITS = {
  maxLogEntries: 50,
  spamCount: 10,
  healthPollMs: 30_000,
} as const;
