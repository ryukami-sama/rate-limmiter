export class ServiceUnavailableError extends Error {
  constructor(message = 'Rate limiter storage unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
