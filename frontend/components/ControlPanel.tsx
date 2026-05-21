'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALGORITHMS, getAlgorithmLabel, parseAlgorithm } from '@/lib/algorithms';
import type { Algorithm } from '@/lib/types';

type ControlPanelProps = {
  algorithm: Algorithm;
  isSending: boolean;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  onSend: () => void;
  onSpam: () => void;
};

export function ControlPanel({
  algorithm,
  isSending,
  onAlgorithmChange,
  onSend,
  onSpam,
}: ControlPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
        <CardDescription>
          Choose an algorithm and send requests against the protected endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="grid w-full max-w-xs gap-2">
          <Label htmlFor="algorithm">Algorithm</Label>
          <Select
            value={algorithm}
            onValueChange={(value) => {
              const nextAlgorithm = parseAlgorithm(value);
              if (nextAlgorithm) {
                onAlgorithmChange(nextAlgorithm);
              }
            }}
          >
            <SelectTrigger id="algorithm" className="w-full">
              <SelectValue>{getAlgorithmLabel(algorithm)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALGORITHMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="animate-spin" />
                Sending
              </>
            ) : (
              'Send request'
            )}
          </Button>
          <Button variant="outline" onClick={onSpam} disabled={isSending}>
            Send 10 requests
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
