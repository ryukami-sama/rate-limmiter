import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAlgorithmLabel } from '@/lib/algorithms';
import type { LogEntry, RequestStatusKind } from '@/lib/types';

type RequestLogProps = {
  entries: LogEntry[];
  onClear: () => void;
};

function statusBadge(statusKind: RequestStatusKind, status: number) {
  switch (statusKind) {
    case 'success':
      return <Badge variant="secondary">200</Badge>;
    case 'rate_limited':
      return <Badge variant="destructive">429</Badge>;
    case 'unavailable':
      return <Badge variant="outline">503</Badge>;
    case 'error':
      return <Badge variant="outline">{status > 0 ? String(status) : 'Failed'}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function RequestLog({ entries, onClear }: RequestLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request log</CardTitle>
        <CardDescription>Most recent responses first.</CardDescription>
        {entries.length > 0 && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Send a request to see results here.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {entry.timestamp}
                  </span>
                  <span>{getAlgorithmLabel(entry.algorithm)}</span>
                  {statusBadge(entry.statusKind, entry.status)}
                </div>
                {entry.retryAfter !== undefined && (
                  <span className="text-muted-foreground">
                    Retry after {entry.retryAfter}s
                  </span>
                )}
                {entry.error && (
                  <span className="text-destructive">{entry.error}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
