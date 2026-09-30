import { z } from 'zod';

import { PLATFORM_CURRENCY } from '@/lib/currency';
import { isAllowedImageUrl } from '@/lib/images';
import {
  CLEANLINESS_LEVELS,
  GUEST_FREQUENCIES,
  HOUSEHOLD_GENDERS,
  HOUSEHOLD_OCCUPATIONS,
  SOCIAL_LEVELS,
} from '@/lib/labels';
import { BULGARIA_BOUNDS } from '@/lib/map';
import { MAX_STAY_MONTHS } from '@/lib/stay';

const emptyStringToUndefined = z.literal('').transform(() => undefined);

const optionalString = (schema: z.ZodString) =>
  schema.optional().or(emptyStringToUndefined);

const integerFromQuery = z.coerce.number().int();
const booleanFromQuery = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

/**
 * Multi-select filters travel as a single comma-separated param
 * (`?propertyType=ROOM,STUDIO`) rather than a repeated key, so the search URL
 * stays short enough to share and `URLSearchParams` round-trips cleanly.
 */
function csvFromQuery<TItem extends z.ZodType<string, string>>(item: TItem, max: number) {
  return z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .pipe(z.array(item).min(1).max(max))
    .optional()
    .or(emptyStringToUndefined);
}

export const listingStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'PAUSED',
  'ARCHIVED',
]);

export const propertyTypeSchema = z.enum([
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'ROOM',
]);

export const roommatePreferenceSchema = z.enum([
  'ANY',
  'STUDENTS',
  'PROFESSIONALS',
  'WOMEN_ONLY',
  'MEN_ONLY',
]);

export const roomTypeSchema = z.enum(['SINGLE', 'DOUBLE', 'SHARED']);

const ageSchema = z.number().int().min(16).max(99);
const staySchema = z.number().int().min(1).max(MAX_STAY_MONTHS);

const agesInOrder = (min?: number, max?: number) =>
  min === undefined || max === undefined || min <= max;

/**
 * `listing.household` is jsonb: who lives there now, how the home runs, and the age
 * range wanted. Everything is optional. Parsed on read too (`parseListingHousehold`),
 * so a hand-edited row renders nothing rather than something half-typed.
 */
export const listingHouseholdSchema = z
  .object({
    /** People living there now, not counting the new tenant. */
    size: z.number().int().min(0).max(20).optional(),
    genders: z.enum(HOUSEHOLD_GENDERS).optional(),
    ageMin: ageSchema.optional(),
    ageMax: ageSchema.optional(),
    occupation: z.enum(HOUSEHOLD_OCCUPATIONS).optional(),
    smokers: z.boolean().optional(),
    pets: z.boolean().optional(),
    cleanliness: z.enum(CLEANLINESS_LEVELS).optional(),
    social: z.enum(SOCIAL_LEVELS).optional(),
    guests: z.enum(GUEST_FREQUENCIES).optional(),
    preferredAgeMin: ageSchema.optional(),
    preferredAgeMax: ageSchema.optional(),
  })
  .strict()
  .refine((value) => agesInOrder(value.ageMin, value.ageMax), {
    message: 'ageMin must not exceed ageMax.',
    path: ['ageMax'],
  })
  .refine((value) => agesInOrder(value.preferredAgeMin, value.preferredAgeMax), {
    message: 'preferredAgeMin must not exceed preferredAgeMax.',
    path: ['preferredAgeMax'],
  });

export type ListingHousehold = z.infer<typeof listingHouseholdSchema>;

export function parseListingHousehold(value: unknown): ListingHousehold {
  const parsed = listingHouseholdSchema.safeParse(value);

  return parsed.success ? parsed.data : {};
}

/** Case-insensitive on input, but only the platform currency is accepted (`lib/currency.ts`). */
const currencySchema = z.string().trim().toUpperCase().pipe(z.literal(PLATFORM_CURRENCY));

export const listingImageInputSchema = z.object({
  url: z
    .string()
    .url()
    .max(2048)
    .refine(isAllowedImageUrl, 'Upload the photo; external image URLs are not accepted.'),
  alt: z.string().trim().min(1).max(160),
  sortOrder: z.number().int().min(0).max(50).optional(),
});

/**
 * Every listing field, with no creation defaults attached.
 *
 * Defaults belong to creation only. Layering them here and deriving the update
 * schema with `.partial()` does not work: `.partial()` leaves a `.default()`
 * in place, so a PATCH that omits a field re-applies the default instead of
 * leaving the column alone — silently unpublishing a listing, clearing its
 * feature flags, emptying its amenities, or resetting its currency. Splitting
 * the field list from the defaults makes a partial update genuinely partial.
 */
const listingFieldsSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(5000),
  status: listingStatusSchema,
  propertyType: propertyTypeSchema,
  roommatePreference: roommatePreferenceSchema,
  citySlug: z.string().trim().min(2).max(80),
  neighborhoodSlug: optionalString(z.string().trim().min(2).max(100)),
  addressLine: optionalString(z.string().trim().min(3).max(240)),
  monthlyRentCents: z.number().int().positive().max(50_000_000),
  depositCents: z.number().int().nonnegative().max(50_000_000).optional(),
  currency: currencySchema,
  bedroomCount: z.number().int().min(0).max(20),
  bathroomCount: z.number().int().min(0).max(20),
  maxOccupants: z.number().int().min(1).max(30),
  sizeSqm: z.number().int().positive().max(5000).optional(),
  floor: z.number().int().min(-5).max(200).optional(),
  totalFloors: z.number().int().min(0).max(200).optional(),
  // The map pin. `null` removes it; the platform only lists homes in Bulgaria.
  latitude: z.number().min(BULGARIA_BOUNDS.minLat).max(BULGARIA_BOUNDS.maxLat).nullable().optional(),
  longitude: z.number().min(BULGARIA_BOUNDS.minLng).max(BULGARIA_BOUNDS.maxLng).nullable().optional(),
  isFurnished: z.boolean(),
  internetIncluded: z.boolean(),
  utilitiesIncluded: z.boolean(),
  petsAllowed: z.boolean(),
  nearMetro: z.boolean(),
  roommateFriendly: z.boolean(),
  roomType: roomTypeSchema.nullable().optional(),
  privateBathroom: z.boolean(),
  couplesAllowed: z.boolean(),
  smokingAllowed: z.boolean(),
  // `null` clears a bound. min <= max is checked against the stored row on write,
  // since an update may send only one of them (`assertStayRange`).
  minStayMonths: staySchema.nullable().optional(),
  maxStayMonths: staySchema.nullable().optional(),
  household: listingHouseholdSchema,
  availableFrom: z.coerce.date().optional(),
  amenities: z.array(z.string().trim().min(1).max(80)).max(50),
  rules: z.array(z.string().trim().min(1).max(120)).max(50),
  images: z.array(listingImageInputSchema).max(12),
});

export const createListingInputSchema = listingFieldsSchema.extend({
  status: listingStatusSchema.default('DRAFT'),
  roommatePreference: roommatePreferenceSchema.default('ANY'),
  currency: currencySchema.default(PLATFORM_CURRENCY),
  isFurnished: z.boolean().default(false),
  internetIncluded: z.boolean().default(false),
  utilitiesIncluded: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  nearMetro: z.boolean().default(false),
  roommateFriendly: z.boolean().default(false),
  privateBathroom: z.boolean().default(false),
  couplesAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  household: listingHouseholdSchema.default({}),
  amenities: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  rules: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  images: z.array(listingImageInputSchema).max(12).default([]),
});

/** A partial update: omitted fields are left untouched, never reset. */
export const updateListingInputSchema = listingFieldsSchema.partial();

/** Sort keys are part of the public URL, so they are slugs rather than columns. */
export const listingSortSchema = z.enum(['newest', 'price-asc', 'price-desc']);

export const listListingsQuerySchema = z.object({
  q: optionalString(z.string().trim().min(1).max(120)),
  citySlug: optionalString(z.string().trim().min(2).max(80)),
  neighborhoodSlug: csvFromQuery(z.string().trim().min(2).max(100), 40),
  propertyType: csvFromQuery(propertyTypeSchema, 4),
  roommatePreference: roommatePreferenceSchema.optional(),
  roomType: csvFromQuery(roomTypeSchema, 3),
  /** How long the seeker will stay: listings whose min/max stay admits it. */
  stayMonths: integerFromQuery.min(1).max(MAX_STAY_MONTHS).optional(),
  minRentCents: integerFromQuery.nonnegative().optional(),
  maxRentCents: integerFromQuery.nonnegative().optional(),
  bedroomCount: integerFromQuery.min(0).max(20).optional(),
  maxOccupants: integerFromQuery.min(1).max(30).optional(),
  availableFrom: z.coerce.date().optional(),
  isVerified: booleanFromQuery.optional(),
  isFurnished: booleanFromQuery.optional(),
  internetIncluded: booleanFromQuery.optional(),
  utilitiesIncluded: booleanFromQuery.optional(),
  petsAllowed: booleanFromQuery.optional(),
  nearMetro: booleanFromQuery.optional(),
  roommateFriendly: booleanFromQuery.optional(),
  privateBathroom: booleanFromQuery.optional(),
  couplesAllowed: booleanFromQuery.optional(),
  smokingAllowed: booleanFromQuery.optional(),
  sort: listingSortSchema.default('newest'),
  page: integerFromQuery.min(1).max(10_000).default(1),
  perPage: integerFromQuery.min(1).max(50).default(20),
});

export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type RoommatePreference = z.infer<typeof roommatePreferenceSchema>;
export type ListingSort = z.infer<typeof listingSortSchema>;
export type CreateListingInput = z.infer<typeof createListingInputSchema>;
export type UpdateListingInput = z.infer<typeof updateListingInputSchema>;
export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
