import type { ErrorRequestHandler } from 'express';
import { ServiceUnavailableError } from '../errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ServiceUnavailableError) {
    res.status(503).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};
