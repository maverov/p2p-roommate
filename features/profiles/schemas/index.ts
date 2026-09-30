import { z } from 'zod';

import { isAllowedImageUrl } from '@/lib/images';
import { PROFILE_TRAITS, type ProfileTrait } from '@/lib/labels';
import { MAX_STAY_MONTHS, isIsoCalendarDate } from '@/lib/stay';

/**
 * `user_profile.roommate_preferences` is a free-form `jsonb` column, so the
 * fields the product actually understands are declared here once and used by
 * both sides: the PATCH route validates against them, and the profile page
 * parses stored rows through them instead of trusting the column's contents.
 *
 * Every field is optional — a profile fills in as much or as little as it wants.
 */
export const roommatePreferencesSchema = z.object({
  gender: z.enum(['ANY', 'WOMEN_ONLY', 'MEN_ONLY']).optional(),
  smoking: z.boolean().optional(),
  pets: z.boolean().optional(),
  quietHoursFrom: z.string().trim().min(1).max(10).optional(),
  budgetMinCents: z.number().int().nonnegative().max(50_000_000).optional(),
  budgetMaxCents: z.number().int().nonnegative().max(50_000_000).optional(),
  ageMin: z.number().int().min(16).max(120).optional(),
  ageMax: z.number().int().min(16).max(120).optional(),
  occupation: z.string().trim().min(1).max(120).optional(),
  environment: z.string().trim().min(1).max(200).optional(),
});

export const profileTraitSchema = z.enum(PROFILE_TRAITS);

/**
 * Known tags only, each once, in vocabulary order. Used on write (so the stored list is
 * canonical) and on read (rows from before the list was closed may hold free text).
 */
export function parseProfileTraits(value: unknown): ProfileTrait[] {
  if (!Array.isArray(value)) return [];

  const present = new Set<unknown>(value);

  return PROFILE_TRAITS.filter((trait) => present.has(trait));
}

/** Max length of `bio`, shared with the settings form's counter. */
export const PROFILE_BIO_MAX_LENGTH = 2000;

/**
 * Every field is optional (a PATCH changes only what it sends), and the ones a user can
 * clear accept `null`: omitting a field leaves it alone, `null` removes it.
 */
export const updateProfileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(PROFILE_BIO_MAX_LENGTH).nullable().optional(),
  phoneNumber: z.string().trim().min(3).max(40).nullable().optional(),
  citySlug: z.string().trim().min(2).max(80).nullable().optional(),
  neighborhoodSlug: z.string().trim().min(2).max(100).nullable().optional(),
  avatarUrl: z
    .string()
    .url()
    .max(2048)
    .refine(isAllowedImageUrl, 'Upload the photo; external image URLs are not accepted.')
    .nullable()
    .optional(),
  publicContactAllowed: z.boolean().optional(),
  traits: z
    .array(profileTraitSchema)
    .max(PROFILE_TRAITS.length)
    .transform(parseProfileTraits)
    .optional(),
  languages: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  roommatePreferences: roommatePreferencesSchema.optional(),
  // The "room wanted" post. Neighbourhoods are checked against the profile's city
  // on write (`updateOwnProfile`), since that city may come from the stored row.
  lookingForRoom: z.boolean().optional(),
  moveInDate: z.string().refine(isIsoCalendarDate, 'Use YYYY-MM-DD.').nullable().optional(),
  stayMonths: z.number().int().min(1).max(MAX_STAY_MONTHS).nullable().optional(),
  wantedNeighborhoods: z.array(z.string().trim().min(2).max(100)).max(20).optional(),
});

export type RoommatePreferences = z.infer<typeof roommatePreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

/**
 * Read-side parse of a stored blob. Rows written through the API always match
 * the schema, so the only way this fails is a hand-written or seeded row — and
 * there, rendering nothing beats rendering a half-typed value.
 */
export function parseRoommatePreferences(value: unknown): RoommatePreferences {
  const parsed = roommatePreferencesSchema.safeParse(value);

  return parsed.success ? parsed.data : {};
}
