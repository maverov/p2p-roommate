'use client';

import { ImagePlus, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, type ChangeEvent } from 'react';

import { IMAGE_UPLOAD } from '@/lib/images';
import { cn } from '@/utils';

import type { UploadPurpose } from '../constants';
import { ImageUploadError, uploadImage, type UploadErrorCode } from '../upload-image';

type PhotoUploadButtonProps = {
  purpose: UploadPurpose;
  label: string;
  onUploaded: (url: string) => void;
  /** How many more files may be picked; 0 disables the button. */
  remaining?: number;
  multiple?: boolean;
  className?: string;
};

const MAX_MB = IMAGE_UPLOAD.maxBytes / (1024 * 1024);

export function PhotoUploadButton({
  purpose,
  label,
  onUploaded,
  remaining = 1,
  multiple = false,
  className,
}: PhotoUploadButtonProps) {
  const t = useTranslations('common.upload');
  const inputId = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<UploadErrorCode | null>(null);
  const isUploading = progress !== null;

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, remaining);
    // Reset so picking the same file again still fires `change`.
    event.target.value = '';
    setError(null);

    // One at a time: progress stays meaningful and a burst stays under the upload limit.
    for (const file of files) {
      setProgress(0);

      try {
        onUploaded(
          await uploadImage(file, purpose, (percentage) => setProgress(Math.round(percentage))),
        );
      } catch (uploadError) {
        setError(uploadError instanceof ImageUploadError ? uploadError.code : 'failed');
        break;
      } finally {
        setProgress(null);
      }
    }
  };

  const disabled = isUploading || remaining <= 0;

  return (
    <div className={className}>
      <label
        aria-disabled={disabled}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-2 text-[13px] font-medium text-brand-ink transition hover:bg-brand-chip focus-within:outline focus-within:outline-2 focus-within:outline-brand-ink',
          disabled && 'pointer-events-none opacity-60',
        )}
        htmlFor={inputId}
      >
        {isUploading ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ImagePlus aria-hidden="true" className="size-4" />
        )}
        {isUploading ? t('uploading', { percent: progress }) : label}
      </label>
      <input
        accept={IMAGE_UPLOAD.contentTypes.join(',')}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        multiple={multiple}
        onChange={onChange}
        type="file"
      />
      {error && (
        <p className="mt-2 text-[13px] text-red-600" role="alert">
          {t(error, { mb: MAX_MB })}
        </p>
      )}
    </div>
  );
}
