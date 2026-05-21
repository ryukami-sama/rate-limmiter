import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@rate-limiter/shared'],
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default nextConfig;
