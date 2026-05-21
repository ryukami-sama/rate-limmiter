import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function attachRequestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id') ?? randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    console.log(
      JSON.stringify({
        event: 'http_request',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        ip: req.ip,
      }),
    );
  });

  next();
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found' });
}
