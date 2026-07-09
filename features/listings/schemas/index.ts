import { z } from 'zod';

const emptyStringToUndefined = z.literal('').transform(() => undefined);

const optionalString = (schema: z.ZodString) =>
  schema.optional().or(emptyStringToUndefined);

const integerFromQuery = z.coerce.number().int();
const booleanFromQuery = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

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

export const listingImageInputSchema = z.object({
  url: z.string().url().max(2048),
  alt: z.string().trim().min(1).max(160),
  sortOrder: z.number().int().min(0).max(50).optional(),
});

export const createListingInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(5000),
  status: listingStatusSchema.default('DRAFT'),
  propertyType: propertyTypeSchema,
  roommatePreference: roommatePreferenceSchema.default('ANY'),
  citySlug: z.string().trim().min(2).max(80),
  neighborhoodSlug: optionalString(z.string().trim().min(2).max(100)),
  addressLine: optionalString(z.string().trim().min(3).max(240)),
  monthlyRentCents: z.number().int().positive().max(50_000_000),
  depositCents: z.number().int().nonnegative().max(50_000_000).optional(),
  currency: z.string().trim().length(3).default('EUR'),
  bedroomCount: z.number().int().min(0).max(20),
  bathroomCount: z.number().int().min(0).max(20),
  maxOccupants: z.number().int().min(1).max(30),
  sizeSqm: z.number().int().positive().max(5000).optional(),
  floor: z.number().int().min(-5).max(200).optional(),
  totalFloors: z.number().int().min(0).max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isVerified: z.boolean().default(false),
  isFurnished: z.boolean().default(false),
  internetIncluded: z.boolean().default(false),
  utilitiesIncluded: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  nearMetro: z.boolean().default(false),
  roommateFriendly: z.boolean().default(false),
  availableFrom: z.coerce.date().optional(),
  amenities: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  rules: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  images: z.array(listingImageInputSchema).max(12).default([]),
});

export const updateListingInputSchema = createListingInputSchema
  .partial()
  .extend({
    images: z.array(listingImageInputSchema).max(12).optional(),
  });

export const listListingsQuerySchema = z.object({
  q: optionalString(z.string().trim().min(1).max(120)),
  citySlug: optionalString(z.string().trim().min(2).max(80)),
  neighborhoodSlug: optionalString(z.string().trim().min(2).max(100)),
  propertyType: propertyTypeSchema.optional(),
  roommatePreference: roommatePreferenceSchema.optional(),
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
  page: integerFromQuery.min(1).max(10_000).default(1),
  perPage: integerFromQuery.min(1).max(50).default(20),
});

export type CreateListingInput = z.infer<typeof createListingInputSchema>;
export type UpdateListingInput = z.infer<typeof updateListingInputSchema>;
export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
