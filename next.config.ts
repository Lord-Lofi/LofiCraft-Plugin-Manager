import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['adm-zip', 'rcon-client'],
};

export default nextConfig;
