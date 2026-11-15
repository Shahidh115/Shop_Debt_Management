/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shopledger/shared'],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
