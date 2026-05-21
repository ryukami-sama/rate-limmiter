import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ALGORITHMS,
  getAlgorithmLabel,
  isAlgorithm,
  parseAlgorithm,
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_HEADERS,
} from './constants';

test('RATE_LIMIT_HEADERS match standard names', () => {
  assert.equal(RATE_LIMIT_HEADERS.limit, 'X-RateLimit-Limit');
  assert.equal(RATE_LIMIT_HEADERS.retryAfter, 'Retry-After');
});

test('RATE_LIMIT_DEFAULTS are stable demo values', () => {
  assert.equal(RATE_LIMIT_DEFAULTS.maxRequests, 10);
  assert.equal(RATE_LIMIT_DEFAULTS.windowMs, 60_000);
});

test('algorithm helpers validate known values', () => {
  assert.equal(isAlgorithm('token-bucket'), true);
  assert.equal(isAlgorithm('fixed-window'), true);
  assert.equal(isAlgorithm('sliding-window'), false);
  assert.equal(parseAlgorithm('token-bucket'), 'token-bucket');
  assert.equal(parseAlgorithm('invalid'), null);
  assert.equal(getAlgorithmLabel('fixed-window'), 'Fixed window');
  assert.equal(ALGORITHMS.length, 2);
});
