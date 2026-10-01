import type { LocalizedString } from '@/lib/areas';

/**
 * Press office content that grows over time. Each list starts empty, and every section
 * built on one shows a fallback or hides until an entry is added here.
 */

export type PressMention = {
  outlet: string;
  /** A logo under `public/`, drawn in greyscale until hovered. */
  logoSrc: string;
  logoWidth: number;
  logoHeight: number;
  /** The article itself. */
  href: string;
  /** A short pull quote from the coverage, if there is one worth showing. */
  quote?: LocalizedString;
};

/** "As featured in" on the home and press pages; empty hides the section. */
export const PRESS_MENTIONS: PressMention[] = [];

export type PressRelease = {
  /** `YYYY-MM-DD`. */
  date: string;
  title: LocalizedString;
  href: string;
};

/** Newest first. */
export const PRESS_RELEASES: PressRelease[] = [];

export type Spokesperson = {
  name: string;
  role: LocalizedString;
  bio: LocalizedString;
  photoSrc: string | null;
};

export const SPOKESPEOPLE: Spokesperson[] = [];

/** Downloadable press kits. Without a file the card offers to send it by email. */
export const PRESS_ASSETS: Record<'logos' | 'photos', { href: string | null }> = {
  logos: { href: null },
  photos: { href: null },
};
