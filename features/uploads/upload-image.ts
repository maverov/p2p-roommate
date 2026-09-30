'use client';

import { put } from '@vercel/blob/client';

import { IMAGE_UPLOAD } from '@/lib/images';

import type { UploadPurpose } from './constants';

export type UploadErrorCode = 'type' | 'size' | 'notConfigured' | 'rateLimited' | 'failed';

export class ImageUploadError extends Error {
  constructor(readonly code: UploadErrorCode) {
    super(code);
    this.name = 'ImageUploadError';
  }
}

/** Checked in the browser too, so a wrong file fails instantly instead of after a round trip. */
export function validateImageFile(file: File): UploadErrorCode | null {
  if (!(IMAGE_UPLOAD.contentTypes as readonly string[]).includes(file.type)) {
    return 'type';
  }

  return file.size > IMAGE_UPLOAD.maxBytes ? 'size' : null;
}

const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80) || 'photo';

/**
 * The token is fetched here rather than by the Blob client's `upload()`, which reports
 * every failed token request as the same generic error. Reading our own error body is
 * what lets the UI say "uploads are not set up" or "slow down" instead of "failed".
 */
async function fetchClientToken(pathname: string): Promise<string> {
  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'blob.generate-client-token',
      payload: { pathname, clientPayload: null, multipart: false },
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
    const code = body?.error?.code;

    throw new ImageUploadError(
      code === 'UPLOADS_NOT_CONFIGURED'
        ? 'notConfigured'
        : code === 'RATE_LIMITED'
          ? 'rateLimited'
          : 'failed',
    );
  }

  const { clientToken } = (await response.json()) as { clientToken: string };

  return clientToken;
}

/** Uploads straight to Vercel Blob; resolves to the public URL. */
export async function uploadImage(
  file: File,
  purpose: UploadPurpose,
  onProgress?: (percentage: number) => void,
): Promise<string> {
  const invalid = validateImageFile(file);

  if (invalid) {
    throw new ImageUploadError(invalid);
  }

  const pathname = `${purpose}/${safeName(file.name)}`;
  const token = await fetchClientToken(pathname);

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      token,
      contentType: file.type,
      onUploadProgress: onProgress ? ({ percentage }) => onProgress(percentage) : undefined,
    });

    return blob.url;
  } catch {
    throw new ImageUploadError('failed');
  }
}
