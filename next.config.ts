import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Isolate HMR artifacts from production builds.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
};
export default nextConfig;
