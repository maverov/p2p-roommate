/** @type {import('next').NextConfig} */

// Bundle analyzer (optional - only if installed)
let nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["@radix-ui/react-icons"],
  },
};

// Wrap with bundle analyzer only if installed
try {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  nextConfig = withBundleAnalyzer(nextConfig);
} catch (e) {
  // Bundle analyzer not installed, skip it
}

module.exports = nextConfig;
