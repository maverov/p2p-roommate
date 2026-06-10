/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["@radix-ui/react-icons"],
  },
};

module.exports = nextConfig;
