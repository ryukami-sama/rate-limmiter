import type { Request } from 'express';
import { extractRateLimitKey } from '../src/middleware/extractKey';

function mockRequest(overrides: Partial<Request> & { headers?: Record<string, string> } = {}): Request {
  const headers = overrides.headers ?? {};

  return {
    ip: '127.0.0.1',
    header(name: string) {
      return headers[name.toLowerCase()] ?? headers[name];
    },
    ...overrides,
  } as Request;
}

describe('extractRateLimitKey', () => {
  it('uses the client IP by default', () => {
    const key = extractRateLimitKey(mockRequest({ ip: '10.0.0.5' }), {});
    expect(key).toBe('ip:10.0.0.5');
  });

  it('prefers the first x-forwarded-for address', () => {
    const key = extractRateLimitKey(
      mockRequest({ headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' } }),
      {},
    );
    expect(key).toBe('ip:203.0.113.1');
  });

  it('scopes by user id when configured', () => {
    const key = extractRateLimitKey(
      mockRequest({ headers: { 'x-user-id': 'user-42' } }),
      { keyType: 'userId' },
    );
    expect(key).toBe('user:user-42');
  });

  it('scopes by api key header when configured', () => {
    const key = extractRateLimitKey(
      mockRequest({ headers: { 'x-api-key': 'secret-key' } }),
      { keyType: 'apiKey' },
    );
    expect(key).toBe('api-key:secret-key');
  });
});
