import imageHosts from './image-hosts.json';

/**
 * Hosts a listing photo or avatar may live on. Uploads go to Vercel Blob; the seed data
 * points at picsum.photos, so that host is allowed outside production only. The same
 * file feeds `images.remotePatterns` in `next.config.js`, which keeps the image
 * optimizer from fetching arbitrary URLs on anyone's behalf.
 */
const ALLOWED_HOST_PATTERNS: readonly string[] = [
  imageHosts.uploads,
  ...(process.env.NODE_ENV === 'production' ? [] : imageHosts.development),
];

const matchesHost = (hostname: string, pattern: string) =>
  pattern.startsWith('*.') ? hostname.endsWith(pattern.slice(1)) : hostname === pattern;

export function isAllowedImageUrl(value: string): boolean {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return (
    url.protocol === 'https:' &&
    ALLOWED_HOST_PATTERNS.some((pattern) => matchesHost(url.hostname, pattern))
  );
}

/** Upload limits, shared by the upload route and the picker's client-side check. */
export const IMAGE_UPLOAD = {
  maxBytes: 10 * 1024 * 1024,
  contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
} as const;
