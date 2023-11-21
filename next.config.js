/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // SSG (export) vs SSR (standalone)
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
