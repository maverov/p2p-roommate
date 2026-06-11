import { memo } from 'react';
import Image from 'next/image';

// Example: Optimized image component for listings
// Usage:
// <OptimizedListingImage src="/listing-photo.jpg" alt="Apartment" />

export const OptimizedListingImage = memo(function OptimizedListingImage({
  src,
  alt,
  width = 800,
  height = 600,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-gray-100">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={80}
        priority={false}
        className="object-cover w-full h-auto"
      />
    </div>
  );
});
