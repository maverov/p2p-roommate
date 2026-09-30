/** @type {import('next').NextConfig} */

const imageHosts = require('./lib/image-hosts.json');
const mapTiles = require('./lib/map-tiles.json');

const isDev = process.env.NODE_ENV !== 'production';

// An open `hostname: '**'` pattern would let anyone use the image optimizer as a proxy
// for arbitrary URLs. User content is limited further by `lib/images.ts` (uploads only);
// `site` hosts are ones the site's own pages reference (the home testimonials).
const allowedImageHosts = [
  imageHosts.uploads,
  ...imageHosts.site,
  ...(isDev ? imageHosts.development : []),
];

// Map tiles are plain images from the configured provider (`lib/map.ts`). A `{s}`
// subdomain placeholder becomes a wildcard.
const mapTileOrigin = (process.env.NEXT_PUBLIC_MAP_TILE_URL || mapTiles.defaultUrl)
  .match(/^https:\/\/[^/]+/)[0]
  .replace('{s}', '*');

/**
 * `script-src` keeps `'unsafe-inline'` because Next inlines its bootstrap scripts; a
 * nonce would remove it but forces every page to render per request. Everything else is
 * locked to this origin: no plugins, no framing (clickjacking of the admin panel), no
 * foreign form targets. Dev adds `'unsafe-eval'` and `ws:` for webpack HMR.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${mapTileOrigin} ${allowedImageHosts.map((host) => `https://${host}`).join(' ')}`,
  "font-src 'self' data:",
  // Photo uploads go straight from the browser to Vercel Blob, whose client `put()` sends
  // them through `https://vercel.com/api/blob` (`@vercel/blob`'s default API URL).
  `connect-src 'self' https://vercel.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com${isDev ? ' ws:' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
];

let nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Lets a verification build run into its own directory (NEXT_DIST_DIR=.next-check)
  // without overwriting the output a running `next dev` is serving from.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: allowedImageHosts.map((hostname) => ({ protocol: 'https', hostname })),
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  experimental: {
    typedRoutes: true,
    // 14.x reuses a dynamic page's client payload for 30s, so /saved and /messages
    // showed stale data after a mutation until a hard refresh.
    staleTimes: { dynamic: 0 },
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
