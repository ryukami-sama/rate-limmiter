import { cn } from '@/lib/utils';

type StatsBarProps = {
  limit: number;
  remaining: number;
  secondsRemaining: number;
  countdownLabel: string;
  isWaitingToRetry: boolean;
  hasLiveData: boolean;
};

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          highlight && 'text-destructive',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function StatsBar({
  limit,
  remaining,
  secondsRemaining,
  countdownLabel,
  isWaitingToRetry,
  hasLiveData,
}: StatsBarProps) {
  const countdownValue = hasLiveData ? `${secondsRemaining}s` : '—';

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Limit" value={hasLiveData ? String(limit) : '—'} />
      <Stat
        label="Remaining"
        value={hasLiveData ? String(remaining) : '—'}
        highlight={isWaitingToRetry && remaining === 0}
      />
      <Stat
        label={countdownLabel}
        value={countdownValue}
        highlight={isWaitingToRetry}
      />
    </div>
  );
}
