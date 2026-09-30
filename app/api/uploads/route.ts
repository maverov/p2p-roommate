import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { UPLOAD_PURPOSES } from '@/features/uploads/constants';
import { IMAGE_UPLOAD } from '@/lib/images';
import { ApiError, handleApiRoute, requireCurrentUser } from '@/lib/server/api';
import { serverEnv } from '@/lib/server/env';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Issues short-lived tokens for direct browser → Vercel Blob uploads, so photo bytes
 * never pass through this server. The token pins the content type, the size, and a
 * `listings/` or `avatars/` path; the URL only becomes part of a listing or profile
 * once that route's schema accepts it (`lib/images.ts`).
 *
 * Only token requests are handled: no `onUploadCompleted`, so Vercel never calls back.
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);

    if (!serverEnv.BLOB_READ_WRITE_TOKEN) {
      throw new ApiError(503, 'UPLOADS_NOT_CONFIGURED', 'Photo uploads are not configured.');
    }

    const body = (await request.json()) as HandleUploadBody;

    if (body.type !== 'blob.generate-client-token') {
      throw new ApiError(400, 'UNSUPPORTED_UPLOAD_EVENT', 'Only token requests are accepted.');
    }

    await enforceRateLimit('upload', user.id);

    const result = await handleUpload({
      body,
      request,
      token: serverEnv.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        const [purpose] = pathname.split('/');

        if (!UPLOAD_PURPOSES.includes(purpose as (typeof UPLOAD_PURPOSES)[number])) {
          throw new ApiError(400, 'INVALID_UPLOAD_PATH', 'Unknown upload destination.');
        }

        return {
          allowedContentTypes: [...IMAGE_UPLOAD.contentTypes],
          maximumSizeInBytes: IMAGE_UPLOAD.maxBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
    });

    // The Blob client reads this body directly, so it is not wrapped in `{ data }`.
    return NextResponse.json(result);
  });
}
