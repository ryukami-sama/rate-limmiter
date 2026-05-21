import type { Algorithm, DemoState, LogEntry, RequestOutcome } from './types';
import { outcomeToDemoState } from './rateLimit';

export const INITIAL_DEMO_STATE: DemoState = {
  stats: null,
  countdownTarget: null,
  countdownMode: 'reset',
};

export function createLogEntry(
  algorithm: Algorithm,
  outcome: Pick<RequestOutcome, 'status' | 'statusKind' | 'retryAfter'>,
  error?: string,
): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toLocaleTimeString(),
    status: outcome.status,
    statusKind: error ? 'error' : outcome.statusKind,
    algorithm,
    retryAfter: outcome.retryAfter,
    error,
  };
}

export function demoStateFromOutcome(outcome: RequestOutcome): DemoState {
  const receivedAt = Math.floor(Date.now() / 1000);
  return outcomeToDemoState(outcome, receivedAt);
}
