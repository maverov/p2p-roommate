/**
 * Value lists for the DB enums declared in `db/schema.ts`.
 *
 * The unions are re-declared locally so client bundles never pull in the schema
 * module. Their human labels live in `locales/<locale>/enums.json` and are read with
 * `t(\`propertyType.\${value}\`)`; because the key is a template literal over the union,
 * a renamed enum member is still a compile error at every call site.
 */

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM';
export type RoommatePreference =
  | 'ANY'
  | 'STUDENTS'
  | 'PROFESSIONALS'
  | 'WOMEN_ONLY'
  | 'MEN_ONLY';
export type ViewingRequestStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type ReviewerRole = 'TENANT' | 'OWNER';
export type RoomType = 'SINGLE' | 'DOUBLE' | 'SHARED';

export const PROPERTY_TYPES: PropertyType[] = [
  'ROOM',
  'APARTMENT',
  'STUDIO',
  'HOUSE',
];

export const ROOMMATE_PREFERENCES: RoommatePreference[] = [
  'ANY',
  'STUDENTS',
  'PROFESSIONALS',
  'WOMEN_ONLY',
  'MEN_ONLY',
];

export const ROOM_TYPES: RoomType[] = ['SINGLE', 'DOUBLE', 'SHARED'];

/**
 * Household and lifestyle scales. Unlike the lists above these are not DB enums:
 * they live inside `listing.household` (jsonb), validated by `listingHouseholdSchema`.
 * Tuples, because `z.enum` needs the literal values.
 */
export const HOUSEHOLD_GENDERS = ['FEMALE', 'MALE', 'MIXED'] as const;
export const HOUSEHOLD_OCCUPATIONS = ['STUDENTS', 'PROFESSIONALS', 'MIXED'] as const;
export const CLEANLINESS_LEVELS = ['RELAXED', 'TIDY', 'VERY_TIDY'] as const;
export const SOCIAL_LEVELS = ['QUIET', 'BALANCED', 'SOCIAL'] as const;
export const GUEST_FREQUENCIES = ['RARELY', 'SOMETIMES', 'OFTEN'] as const;

/**
 * Lifestyle tags a person can put on their profile: a closed list rather than free
 * text, so profiles can be filtered by them and every tag reads in both languages.
 */
export const PROFILE_TRAITS = [
  'NON_SMOKER',
  'STUDENT',
  'PROFESSIONAL',
  'WORKS_FROM_HOME',
  'EARLY_BIRD',
  'NIGHT_OWL',
  'TIDY',
  'QUIET',
  'SOCIAL',
  'PET_FRIENDLY',
  'HAS_PET',
  'VEGETARIAN',
  'LGBTQ_FRIENDLY',
] as const;

export type ProfileTrait = (typeof PROFILE_TRAITS)[number];

export const REPORT_STATUSES: ReportStatus[] = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'];

/** A tuple rather than a union-typed array, because `z.enum` needs the literal values. */
export const REPORT_REASONS = [
  'SCAM',
  'MISLEADING',
  'UNAVAILABLE',
  'HARASSMENT',
  'FAKE_PROFILE',
  'INAPPROPRIATE',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const LISTING_REPORT_REASONS: ReportReason[] = [
  'SCAM',
  'MISLEADING',
  'UNAVAILABLE',
  'INAPPROPRIATE',
  'OTHER',
];

export const USER_REPORT_REASONS: ReportReason[] = [
  'SCAM',
  'HARASSMENT',
  'FAKE_PROFILE',
  'INAPPROPRIATE',
  'OTHER',
];

export function isReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}
