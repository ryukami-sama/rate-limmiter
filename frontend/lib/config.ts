const DEFAULT_API_URL = 'http://localhost:3001';

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}
