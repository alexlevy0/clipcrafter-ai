/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "standalone", // SSG (export) vs SSR (standalone)
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

export default nextConfig;
