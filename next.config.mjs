/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  experimental: { images: { unoptimized: true } },
  basePath: '/docs',
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
