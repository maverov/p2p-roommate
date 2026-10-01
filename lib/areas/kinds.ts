/**
 * City landing pages by kind of home ("apartments for rent in Sofia"). Each kind is a
 * listing search, so these filters build its page, its counts, its sitemap entries and
 * its "see all" link alike.
 */
export const AREA_KINDS = ['apartments', 'students'] as const;

export type AreaKind = (typeof AREA_KINDS)[number];

/** As search query parameters, so they parse like any `/listings` URL. */
export const AREA_KIND_FILTERS: Record<AreaKind, Record<string, string>> = {
  // Whole homes: a studio is a small apartment.
  apartments: { propertyType: 'APARTMENT,STUDIO,HOUSE' },
  // Listings whose owner prefers students.
  students: { roommatePreference: 'STUDENTS' },
};

/** The first path segment, `/{locale}/{segment}/{city}`; each has its folder under `app/[locale]`. */
export const AREA_KIND_SEGMENTS: Record<AreaKind, string> = {
  apartments: 'apartments',
  students: 'student-housing',
};
