'use client';

import { AlertTriangle } from 'lucide-react';
import { ControlPanel } from '@/components/ControlPanel';
import { RateLimitBanner } from '@/components/RateLimitBanner';
import { RequestLog } from '@/components/RequestLog';
import { StatsBar } from '@/components/StatsBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRateLimitDemo } from '@/hooks/useRateLimitDemo';
import { getApiUrl } from '@/lib/config';

export default function HomePage() {
  const {
    algorithm,
    setAlgorithm,
    log,
    stats,
    hasLiveData,
    health,
    showLimitBanner,
    isSending,
    errorMessage,
    secondsRemaining,
    countdownLabel,
    isWaitingToRetry,
    handleSend,
    handleSpam,
    clearLog,
  } = useRateLimitDemo();

  const isBackendHealthy = health?.healthy ?? null;

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Rate limiter demo</h1>
          <p className="text-sm text-muted-foreground">
            Test token bucket and fixed window rate limiting backed by Redis.
          </p>
          <p className="text-xs text-muted-foreground">Backend URL: {getApiUrl()}</p>
        </div>

        {isBackendHealthy === false && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Backend unavailable</AlertTitle>
            <AlertDescription>
              Could not reach the API at {getApiUrl()}
              {health?.redis === 'down' ? ' (Redis is down).' : '.'}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="min-h-[76px]">
          <RateLimitBanner
            visible={showLimitBanner}
            secondsRemaining={secondsRemaining}
          />
        </div>

        <ControlPanel
          algorithm={algorithm}
          isSending={isSending}
          onAlgorithmChange={setAlgorithm}
          onSend={handleSend}
          onSpam={handleSpam}
        />

        <Card>
          <CardHeader>
            <CardTitle>Rate limit status</CardTitle>
            <CardDescription>
              Values come from response headers. When blocked, the countdown follows Retry-After.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatsBar
              limit={stats?.limit ?? 0}
              remaining={stats?.remaining ?? 0}
              secondsRemaining={secondsRemaining}
              countdownLabel={countdownLabel}
              isWaitingToRetry={isWaitingToRetry}
              hasLiveData={hasLiveData}
            />
          </CardContent>
        </Card>

        <RequestLog entries={log} onClear={clearLog} />
      </main>
    </div>
  );
}
