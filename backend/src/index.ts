import type { Server } from 'node:http';
import { app } from './app';
import { config } from './config';
import { SHUTDOWN_TIMEOUT_MS } from './constants';
import { connectRedis, disconnectRedis } from './redis';

let server: Server | null = null;
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(JSON.stringify({ event: 'shutdown', signal }));

  const forceExitTimer = setTimeout(() => {
    console.error(JSON.stringify({ event: 'shutdown_timeout', timeoutMs: SHUTDOWN_TIMEOUT_MS }));
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    await disconnectRedis();
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error(error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  await connectRedis();

  server = app.listen(config.port, () => {
    console.log(
      JSON.stringify({
        event: 'startup',
        port: config.port,
        environment: config.isProduction ? 'production' : 'development',
      }),
    );
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

main().catch(async (error) => {
  console.error('Failed to start server:', error);
  await disconnectRedis();
  process.exit(1);
});
