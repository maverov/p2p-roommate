import Image from 'next/image';

import { cn } from '@/utils';

export function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase() || '?'
  );
}

type AvatarProps = {
  /** Used for the initials fallback; the avatar itself is decorative. */
  name: string;
  src?: string | null;
  /** Rendered size in px — drives both the box and the initials scale. */
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Decorative (`aria-hidden`) avatar: the accompanying name or the parent
 * control's label always carries the accessible text.
 */
export function Avatar({ name, src, size = 40, className, priority }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-brand-border bg-brand-sand font-semibold leading-none text-brand-ink',
        className,
      )}
      style={{ height: size, width: size, fontSize: Math.round(size * 0.36) }}
    >
      {src ? (
        <Image
          alt=""
          className="object-cover"
          fill
          priority={priority}
          sizes={`${size}px`}
          src={src}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
