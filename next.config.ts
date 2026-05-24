import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['adm-zip', 'rcon-client'],
  reactStrictMode: false,
};

export default nextConfig;
