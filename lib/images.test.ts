import { afterEach, describe, expect, it, vi } from 'vitest';

import { isAllowedImageUrl } from './images';

const BLOB_URL = 'https://abc123.public.blob.vercel-storage.com/listings/photo-x1y2.jpg';

describe('isAllowedImageUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('accepts Vercel Blob uploads', () => {
    expect(isAllowedImageUrl(BLOB_URL)).toBe(true);
  });

  it.each([
    ['plain http', BLOB_URL.replace('https:', 'http:')],
    ['an arbitrary host', 'https://example.com/photo.jpg'],
    ['a lookalike suffix', 'https://x.public.blob.vercel-storage.com.evil.test/a.jpg'],
    ['the bare storage domain', 'https://public.blob.vercel-storage.com/a.jpg'],
    ['a data URL', 'data:image/png;base64,AAAA'],
    ['a host only the site itself may use', 'https://randomuser.me/api/portraits/women/44.jpg'],
    ['not a URL', 'photo.jpg'],
  ])('rejects %s', (_label, url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });

  it('allows the seed image host outside production only', async () => {
    const seedUrl = 'https://picsum.photos/seed/room/800/600';
    expect(isAllowedImageUrl(seedUrl)).toBe(true);

    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const production = await import('./images');

    expect(production.isAllowedImageUrl(seedUrl)).toBe(false);
    expect(production.isAllowedImageUrl(BLOB_URL)).toBe(true);
  });
});
