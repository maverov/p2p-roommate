import { memo } from 'react';
import Image from 'next/image';

export const OptimizedListingImage = memo(function OptimizedListingImage({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-gray-100">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={85}
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAICAgIChsICQkJChAODg4QDg4BGBMODg4U"
        className="object-cover w-full h-auto"
      />
    </div>
  );
});
