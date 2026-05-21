import Redis from 'ioredis';
import { config } from './config';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    client.on('error', (error) => {
      console.error(JSON.stringify({ event: 'redis_error', message: error.message }));
    });
  }

  return client;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    const response = await redis.ping();
    return response === 'PONG';
  } catch {
    return false;
  }
}

export async function connectRedis(): Promise<void> {
  if (client && client.status === 'end') {
    client = null;
  }

  const redis = getRedis();
  if (redis.status === 'ready') {
    return;
  }

  if (redis.status === 'wait') {
    await redis.connect();
  }

  await redis.ping();
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

export function resetRedisClient(): void {
  client = null;
}

export function isRedisUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  return (
    name.includes('maxretriesperrequest')
    || name.includes('cluster')
    || message.includes('connect')
    || message.includes('connection')
    || message.includes('econnrefused')
    || message.includes('closed')
  );
}
