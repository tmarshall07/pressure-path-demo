/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  experimental: { images: { unoptimized: true } },
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
};

export default nextConfig;
