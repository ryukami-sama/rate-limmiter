'use client';

import { useEffect, useState } from 'react';

export function useClock(intervalMs: number = 1000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
