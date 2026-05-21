import type { Request } from 'express';
import type { KeyType, RateLimiterOptions } from '../types';

export function extractRateLimitKey(req: Request, options: Pick<RateLimiterOptions, 'keyType' | 'keyHeader'>): string {
  const keyType: KeyType = options.keyType ?? 'ip';

  switch (keyType) {
    case 'userId': {
      const userId = req.header('x-user-id');
      return userId ? `user:${userId}` : 'user:anonymous';
    }
    case 'apiKey': {
      const headerName = options.keyHeader ?? 'x-api-key';
      const apiKey = req.header(headerName);
      return apiKey ? `api-key:${apiKey}` : 'api-key:missing';
    }
    case 'ip':
    default: {
      const forwarded = req.header('x-forwarded-for');
      if (forwarded) {
        return `ip:${forwarded.split(',')[0]?.trim() ?? req.ip}`;
      }
      return `ip:${req.ip ?? 'unknown'}`;
    }
  }
}
