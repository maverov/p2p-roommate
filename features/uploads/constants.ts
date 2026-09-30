/** First path segment of every upload; the upload route rejects anything else. */
export const UPLOAD_PURPOSES = ['listings', 'avatars'] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];
