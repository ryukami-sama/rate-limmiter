import type { Algorithm } from './types';

export const queryKeys = {
  health: ['health'] as const,
  demoState: (algorithm: Algorithm) => ['demo-state', algorithm] as const,
  requestLog: ['request-log'] as const,
};
