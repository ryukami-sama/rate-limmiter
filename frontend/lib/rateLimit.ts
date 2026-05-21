import type { Algorithm, RateLimitStats, RequestOutcome } from './types';

export type CountdownState = {
  targetAt: number;
  mode: 'retry' | 'reset';
};

export function buildCountdownState(
  outcome: Pick<RequestOutcome, 'status' | 'stats' | 'retryAfter'>,
  receivedAt: number = Math.floor(Date.now() / 1000),
): CountdownState | null {
  if (outcome.status === 429 && outcome.retryAfter !== undefined) {
    return {
      targetAt: receivedAt + outcome.retryAfter,
      mode: 'retry',
    };
  }

  if (outcome.stats?.resetAt) {
    return {
      targetAt: outcome.stats.resetAt,
      mode: 'reset',
    };
  }

  return null;
}

export function secondsUntil(targetAt: number, now: number): number {
  return Math.max(0, targetAt - now);
}

export function outcomeToDemoState(
  outcome: RequestOutcome,
  receivedAt: number = Math.floor(Date.now() / 1000),
): {
  stats: RateLimitStats | null;
  countdownTarget: number | null;
  countdownMode: 'retry' | 'reset';
} {
  const countdown = buildCountdownState(outcome, receivedAt);

  return {
    stats: outcome.stats,
    countdownTarget: countdown?.targetAt ?? outcome.stats?.resetAt ?? null,
    countdownMode: countdown?.mode ?? 'reset',
  };
}

export function deriveCountdownView(
  demoState: {
    countdownMode: 'retry' | 'reset';
    countdownTarget: number | null;
    stats: RateLimitStats | null;
  },
  now: number,
): {
  countdownLabel: string;
  secondsRemaining: number;
  isWaitingToRetry: boolean;
  showLimitBanner: boolean;
} {
  const retrySecondsRemaining = demoState.countdownMode === 'retry' && demoState.countdownTarget !== null
    ? secondsUntil(demoState.countdownTarget, now)
    : 0;

  const resetTarget = demoState.stats?.resetAt ?? demoState.countdownTarget;
  const resetSecondsRemaining = resetTarget !== null ? secondsUntil(resetTarget, now) : 0;

  const isWaitingToRetry = retrySecondsRemaining > 0;

  return {
    countdownLabel: isWaitingToRetry ? 'Retry in' : 'Resets in',
    secondsRemaining: isWaitingToRetry ? retrySecondsRemaining : resetSecondsRemaining,
    isWaitingToRetry,
    showLimitBanner: isWaitingToRetry,
  };
}
