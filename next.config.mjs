/** @type {import('next').NextConfig} */
import("next").NextConfig;

const nextConfig = {
  compiler: {
    // removeConsole: false,
  },
  // transpilePackages: ["styled-jsx"],
  transpilePackages: ["styled-jsx", "@splinetool/r3f-spline", "@splinetool/loader"],
  output: "standalone", // SSG (export) vs SSR (standalone)
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // productionBrowserSourceMaps: true,
  // compress: false,
  webpack: (config) => {
    // config.output.pathinfo = true;
    // config.optimization.concatenateModules = false;
    // config.optimization.usedExports = false;
    // config.optimization.splitChunks = false;
    // config.optimization.minimize = false;
    config.resolve.fallback = { fs: false };
    return config;
  },
};

export default nextConfig;
