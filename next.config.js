/** @type {import('next').NextConfig} */

// Bundle analyzer (optional - only if installed)
let nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Lets a verification build run into its own directory (NEXT_DIST_DIR=.next-check)
  // without overwriting the output a running `next dev` is serving from.
  distDir: process.env.NEXT_DIST_DIR || '.next',

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

// Points next-intl at the request config that loads the namespaced message files.
const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

nextConfig = withNextIntl(nextConfig);

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
