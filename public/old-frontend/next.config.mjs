/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {},
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Disable webpack caching to prevent memory issues
    config.cache = false;
    return config;
  },
};

export default nextConfig;
