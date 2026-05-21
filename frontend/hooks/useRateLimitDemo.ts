'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useClock } from '@/hooks/useClock';
import { ALGORITHMS } from '@/lib/algorithms';
import { ApiRequestError, checkBackendHealth, sendRateLimitedRequest } from '@/lib/api';
import { DEMO_LIMITS } from '@/lib/constants';
import {
  createLogEntry,
  demoStateFromOutcome,
  INITIAL_DEMO_STATE,
} from '@/lib/demo-state';
import { queryKeys } from '@/lib/query-keys';
import { deriveCountdownView } from '@/lib/rateLimit';
import type { Algorithm, DemoState, LogEntry, RequestOutcome } from '@/lib/types';

function prependLogEntry(log: LogEntry[], entry: LogEntry): LogEntry[] {
  return [entry, ...log].slice(0, DEMO_LIMITS.maxLogEntries);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
}

export function useRateLimitDemo() {
  const queryClient = useQueryClient();
  const [algorithm, setAlgorithm] = useState<Algorithm>('token-bucket');
  const now = useClock();

  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: checkBackendHealth,
    refetchInterval: DEMO_LIMITS.healthPollMs,
  });

  const { data: demoState = INITIAL_DEMO_STATE } = useQuery({
    queryKey: queryKeys.demoState(algorithm),
    queryFn: () => INITIAL_DEMO_STATE,
    initialData: INITIAL_DEMO_STATE,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const { data: log = [] } = useQuery({
    queryKey: queryKeys.requestLog,
    queryFn: () => [] as LogEntry[],
    initialData: [] as LogEntry[],
    staleTime: Number.POSITIVE_INFINITY,
  });

  const applyOutcome = (targetAlgorithm: Algorithm, outcome: RequestOutcome) => {
    queryClient.setQueryData<DemoState>(
      queryKeys.demoState(targetAlgorithm),
      demoStateFromOutcome(outcome),
    );

    queryClient.setQueryData<LogEntry[]>(
      queryKeys.requestLog,
      (current = []) => prependLogEntry(current, createLogEntry(targetAlgorithm, outcome)),
    );
  };

  const applyError = (targetAlgorithm: Algorithm, error: unknown) => {
    const message = getErrorMessage(error);

    queryClient.setQueryData<LogEntry[]>(
      queryKeys.requestLog,
      (current = []) => prependLogEntry(
        current,
        createLogEntry(targetAlgorithm, { status: 0, statusKind: 'error' }, message),
      ),
    );
  };

  const sendMutation = useMutation({
    mutationFn: sendRateLimitedRequest,
    onSuccess: (outcome, targetAlgorithm) => {
      applyOutcome(targetAlgorithm, outcome);
    },
    onError: (error, targetAlgorithm) => {
      applyError(targetAlgorithm, error);
    },
  });

  const spamMutation = useMutation({
    mutationFn: async (targetAlgorithm: Algorithm) => Promise.all(
      Array.from({ length: DEMO_LIMITS.spamCount }, () => sendRateLimitedRequest(targetAlgorithm)),
    ),
    onSuccess: (outcomes, targetAlgorithm) => {
      outcomes.forEach((outcome) => applyOutcome(targetAlgorithm, outcome));
    },
    onError: (error, targetAlgorithm) => {
      applyError(targetAlgorithm, error);
    },
  });

  const countdownView = useMemo(
    () => deriveCountdownView(demoState, now),
    [demoState, now],
  );

  const algorithmLog = useMemo(
    () => log.filter((entry) => entry.algorithm === algorithm),
    [algorithm, log],
  );

  const errorMessage = sendMutation.isError
    ? getErrorMessage(sendMutation.error)
    : spamMutation.isError
      ? getErrorMessage(spamMutation.error)
      : null;

  const clearLog = () => {
    queryClient.setQueryData(queryKeys.requestLog, []);
    ALGORITHMS.forEach((item) => {
      queryClient.setQueryData(queryKeys.demoState(item.value), INITIAL_DEMO_STATE);
    });
    sendMutation.reset();
    spamMutation.reset();
  };

  return {
    algorithm,
    setAlgorithm: (nextAlgorithm: Algorithm) => {
      setAlgorithm(nextAlgorithm);
      sendMutation.reset();
      spamMutation.reset();
    },
    log: algorithmLog,
    stats: demoState.stats,
    hasLiveData: demoState.stats !== null,
    health: healthQuery.data,
    isSending: sendMutation.isPending || spamMutation.isPending,
    errorMessage,
    handleSend: () => sendMutation.mutate(algorithm),
    handleSpam: () => spamMutation.mutate(algorithm),
    clearLog,
    ...countdownView,
  };
}
