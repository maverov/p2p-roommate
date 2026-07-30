import { z } from 'zod';

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

export const updateProfileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  phoneNumber: z.string().trim().min(3).max(40).optional(),
  citySlug: z.string().trim().min(2).max(80).optional(),
  neighborhoodSlug: z.string().trim().min(2).max(100).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  publicContactAllowed: z.boolean().optional(),
  traits: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  languages: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  roommatePreferences: roommatePreferencesSchema.optional(),
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
