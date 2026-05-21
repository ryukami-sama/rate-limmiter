import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type RateLimitBannerProps = {
  visible: boolean;
  secondsRemaining: number;
};

export function RateLimitBanner({ visible, secondsRemaining }: RateLimitBannerProps) {
  return (
    <Alert
      variant="destructive"
      className={cn(
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!visible}
    >
      <AlertCircle />
      <AlertTitle>Rate limit exceeded</AlertTitle>
      <AlertDescription>
        Retry in {secondsRemaining}s.
      </AlertDescription>
    </Alert>
  );
}
