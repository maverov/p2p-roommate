import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

import { generator as generateBetterAuthOpenApi } from '../node_modules/better-auth/dist/plugins/open-api/generator.mjs';
import { PLATFORM_CURRENCY } from '../lib/currency';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../lib/auth-rules';
import { IMAGE_UPLOAD } from '../lib/images';
import imageHosts from '../lib/image-hosts.json';
import { API_CONTACT_PLACEHOLDER } from '../lib/contact-redaction';
import {
  CLEANLINESS_LEVELS,
  GUEST_FREQUENCIES,
  HOUSEHOLD_GENDERS,
  HOUSEHOLD_OCCUPATIONS,
  PROFILE_TRAITS,
  REPORT_REASONS,
  ROOM_TYPES,
  SOCIAL_LEVELS,
} from '../lib/labels';
import { BULGARIA_BOUNDS } from '../lib/map';
import { MAX_STAY_MONTHS } from '../lib/stay';

type JsonObject = Record<string, unknown>;
type PathItem = Record<string, JsonObject>;

const schemaRef = (name: string): JsonObject => ({
  $ref: `#/components/schemas/${name}`,
});

const dateTimeSchema: JsonObject = { type: 'string', format: 'date-time' };
const nullableDateTimeSchema: JsonObject = {
  type: ['string', 'null'],
  format: 'date-time',
};
const nullableStringSchema: JsonObject = { type: ['string', 'null'] };
const nullableIntegerSchema: JsonObject = { type: ['integer', 'null'] };
const nullableNumberSchema: JsonObject = { type: ['number', 'null'] };

/** Mirrors `isAllowedImageUrl` (`lib/images.ts`): only photos uploaded through `/api/uploads`. */
const uploadedImageUrlSchema: JsonObject = {
  type: 'string',
  format: 'uri',
  maxLength: 2048,
  description: `An https URL on \`${imageHosts.uploads}\`, as returned by an upload. External image URLs are rejected.`,
};

const listingStatusSchema: JsonObject = {
  type: 'string',
  enum: ['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED'],
};
const propertyTypeSchema: JsonObject = {
  type: 'string',
  enum: ['APARTMENT', 'HOUSE', 'STUDIO', 'ROOM'],
};
const roommatePreferenceSchema: JsonObject = {
  type: 'string',
  enum: ['ANY', 'STUDENTS', 'PROFESSIONALS', 'WOMEN_ONLY', 'MEN_ONLY'],
};
const viewingRequestStatusSchema: JsonObject = {
  type: 'string',
  enum: ['REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED'],
};
const reviewerRoleSchema: JsonObject = {
  type: 'string',
  enum: ['TENANT', 'OWNER'],
};

const roomTypeSchema: JsonObject = { type: 'string', enum: ROOM_TYPES };
const profileTraitSchema: JsonObject = { type: 'string', enum: [...PROFILE_TRAITS] };
const staySchema: JsonObject = { type: 'integer', minimum: 1, maximum: MAX_STAY_MONTHS };
const nullableStaySchema: JsonObject = { ...staySchema, type: ['integer', 'null'] };
const calendarDateSchema: JsonObject = { type: 'string', format: 'date' };

const CONTACT_MASKING_NOTE = `For signed-out callers, phone numbers and email addresses in owner-written text are replaced with \`${API_CONTACT_PLACEHOLDER}\`.`;

const listingWritableProperties: Record<string, JsonObject> = {
  title: { type: 'string', minLength: 3, maxLength: 120 },
  description: { type: 'string', minLength: 20, maxLength: 5000 },
  status: listingStatusSchema,
  propertyType: propertyTypeSchema,
  roommatePreference: roommatePreferenceSchema,
  citySlug: { type: 'string', minLength: 2, maxLength: 80 },
  neighborhoodSlug: { type: 'string', minLength: 2, maxLength: 100 },
  addressLine: { type: 'string', minLength: 3, maxLength: 240 },
  monthlyRentCents: {
    type: 'integer',
    minimum: 1,
    maximum: 50_000_000,
  },
  depositCents: {
    type: 'integer',
    minimum: 0,
    maximum: 50_000_000,
  },
  currency: {
    type: 'string',
    enum: [PLATFORM_CURRENCY],
    description: 'Case-insensitive on input. Only the platform currency is accepted.',
  },
  bedroomCount: { type: 'integer', minimum: 0, maximum: 20 },
  bathroomCount: { type: 'integer', minimum: 0, maximum: 20 },
  maxOccupants: { type: 'integer', minimum: 1, maximum: 30 },
  sizeSqm: { type: 'integer', minimum: 1, maximum: 5000 },
  floor: { type: 'integer', minimum: -5, maximum: 200 },
  totalFloors: { type: 'integer', minimum: 0, maximum: 200 },
  latitude: {
    type: ['number', 'null'],
    minimum: BULGARIA_BOUNDS.minLat,
    maximum: BULGARIA_BOUNDS.maxLat,
    description: 'The map pin, in Bulgaria. `null` removes it.',
  },
  longitude: {
    type: ['number', 'null'],
    minimum: BULGARIA_BOUNDS.minLng,
    maximum: BULGARIA_BOUNDS.maxLng,
  },
  roomType: {
    anyOf: [roomTypeSchema, { type: 'null' }],
    description: 'The room on offer; `null` is the whole property.',
  },
  privateBathroom: { type: 'boolean' },
  couplesAllowed: { type: 'boolean' },
  smokingAllowed: { type: 'boolean' },
  minStayMonths: {
    ...nullableStaySchema,
    description: 'Must not exceed `maxStayMonths` (checked against the stored value on update).',
  },
  maxStayMonths: nullableStaySchema,
  household: schemaRef('ListingHousehold'),
  isFurnished: { type: 'boolean' },
  internetIncluded: { type: 'boolean' },
  utilitiesIncluded: { type: 'boolean' },
  petsAllowed: { type: 'boolean' },
  nearMetro: { type: 'boolean' },
  roommateFriendly: { type: 'boolean' },
  availableFrom: dateTimeSchema,
  amenities: {
    type: 'array',
    maxItems: 50,
    items: { type: 'string', minLength: 1, maxLength: 80 },
  },
  rules: {
    type: 'array',
    maxItems: 50,
    items: { type: 'string', minLength: 1, maxLength: 120 },
  },
  images: {
    type: 'array',
    maxItems: 12,
    items: schemaRef('ListingImageInput'),
  },
};

const components: JsonObject = {
  schemas: {
    ApiError: {
      type: 'object',
      additionalProperties: false,
      required: ['error'],
      properties: {
        error: {
          type: 'object',
          additionalProperties: false,
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Request validation failed.' },
            details: {},
          },
        },
      },
    },
    OwnerSummary: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'name', 'image'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        image: nullableStringSchema,
      },
    },
    ListingImageInput: {
      type: 'object',
      additionalProperties: false,
      required: ['url', 'alt'],
      properties: {
        url: uploadedImageUrlSchema,
        alt: { type: 'string', minLength: 1, maxLength: 160 },
        sortOrder: { type: 'integer', minimum: 0, maximum: 50 },
      },
    },
    ListingImage: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'listingId', 'url', 'alt', 'sortOrder', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string' },
        listingId: { type: 'string' },
        url: { type: 'string', format: 'uri' },
        alt: { type: 'string' },
        sortOrder: { type: 'integer' },
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
      },
    },
    ListingHousehold: {
      type: 'object',
      additionalProperties: false,
      description: 'Who already lives there. Every field is optional.',
      properties: {
        size: { type: 'integer', minimum: 0, maximum: 20 },
        genders: { type: 'string', enum: [...HOUSEHOLD_GENDERS] },
        ageMin: { type: 'integer', minimum: 16, maximum: 99 },
        ageMax: { type: 'integer', minimum: 16, maximum: 99 },
        occupation: { type: 'string', enum: [...HOUSEHOLD_OCCUPATIONS] },
        smokers: { type: 'boolean' },
        pets: { type: 'boolean' },
        cleanliness: { type: 'string', enum: [...CLEANLINESS_LEVELS] },
        social: { type: 'string', enum: [...SOCIAL_LEVELS] },
        guests: { type: 'string', enum: [...GUEST_FREQUENCIES] },
        preferredAgeMin: { type: 'integer', minimum: 16, maximum: 99 },
        preferredAgeMax: { type: 'integer', minimum: 16, maximum: 99 },
      },
    },
    ListingRecord: {
      type: 'object',
      required: [
        'id',
        'ownerId',
        'title',
        'description',
        'status',
        'propertyType',
        'roommatePreference',
        'citySlug',
        'neighborhoodSlug',
        'addressLine',
        'monthlyRentCents',
        'depositCents',
        'currency',
        'bedroomCount',
        'bathroomCount',
        'maxOccupants',
        'sizeSqm',
        'floor',
        'totalFloors',
        'latitude',
        'longitude',
        'isVerified',
        'isFurnished',
        'internetIncluded',
        'utilitiesIncluded',
        'petsAllowed',
        'nearMetro',
        'roommateFriendly',
        'roomType',
        'privateBathroom',
        'couplesAllowed',
        'smokingAllowed',
        'minStayMonths',
        'maxStayMonths',
        'household',
        'availableFrom',
        'amenities',
        'rules',
        'publishedAt',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string' },
        ownerId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: listingStatusSchema,
        propertyType: propertyTypeSchema,
        roommatePreference: roommatePreferenceSchema,
        citySlug: { type: 'string' },
        neighborhoodSlug: nullableStringSchema,
        addressLine: nullableStringSchema,
        monthlyRentCents: { type: 'integer' },
        depositCents: nullableIntegerSchema,
        currency: { type: 'string', enum: [PLATFORM_CURRENCY] },
        bedroomCount: { type: 'integer' },
        bathroomCount: { type: 'integer' },
        maxOccupants: { type: 'integer' },
        sizeSqm: nullableIntegerSchema,
        floor: nullableIntegerSchema,
        totalFloors: nullableIntegerSchema,
        latitude: nullableNumberSchema,
        longitude: nullableNumberSchema,
        isVerified: { type: 'boolean' },
        isFurnished: { type: 'boolean' },
        internetIncluded: { type: 'boolean' },
        utilitiesIncluded: { type: 'boolean' },
        petsAllowed: { type: 'boolean' },
        nearMetro: { type: 'boolean' },
        roommateFriendly: { type: 'boolean' },
        roomType: { anyOf: [roomTypeSchema, { type: 'null' }] },
        privateBathroom: { type: 'boolean' },
        couplesAllowed: { type: 'boolean' },
        smokingAllowed: { type: 'boolean' },
        minStayMonths: nullableIntegerSchema,
        maxStayMonths: nullableIntegerSchema,
        household: schemaRef('ListingHousehold'),
        availableFrom: nullableDateTimeSchema,
        amenities: { type: 'array', items: { type: 'string' } },
        rules: { type: 'array', items: { type: 'string' } },
        publishedAt: nullableDateTimeSchema,
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
      },
    },
    Listing: {
      allOf: [
        schemaRef('ListingRecord'),
        {
          type: 'object',
          required: ['owner', 'images'],
          properties: {
            owner: schemaRef('OwnerSummary'),
            images: {
              type: 'array',
              items: schemaRef('ListingImage'),
            },
          },
        },
      ],
    },
    ListingWithImages: {
      allOf: [
        schemaRef('ListingRecord'),
        {
          type: 'object',
          required: ['images'],
          properties: {
            images: {
              type: 'array',
              items: schemaRef('ListingImage'),
            },
          },
        },
      ],
    },
    SavedListing: {
      allOf: [
        schemaRef('Listing'),
        {
          type: 'object',
          required: ['savedAt'],
          properties: { savedAt: nullableDateTimeSchema },
        },
      ],
    },
    CreateListingInput: {
      type: 'object',
      additionalProperties: false,
      required: [
        'title',
        'description',
        'propertyType',
        'citySlug',
        'monthlyRentCents',
        'bedroomCount',
        'bathroomCount',
        'maxOccupants',
      ],
      properties: {
        ...listingWritableProperties,
        status: { ...listingStatusSchema, default: 'DRAFT' },
        roommatePreference: {
          ...roommatePreferenceSchema,
          default: 'ANY',
        },
        currency: {
          ...listingWritableProperties.currency,
          default: PLATFORM_CURRENCY,
        },
        isFurnished: { type: 'boolean', default: false },
        internetIncluded: { type: 'boolean', default: false },
        utilitiesIncluded: { type: 'boolean', default: false },
        petsAllowed: { type: 'boolean', default: false },
        nearMetro: { type: 'boolean', default: false },
        roommateFriendly: { type: 'boolean', default: false },
        privateBathroom: { type: 'boolean', default: false },
        couplesAllowed: { type: 'boolean', default: false },
        smokingAllowed: { type: 'boolean', default: false },
        household: { ...schemaRef('ListingHousehold'), default: {} },
        amenities: {
          ...listingWritableProperties.amenities,
          default: [],
        },
        rules: { ...listingWritableProperties.rules, default: [] },
        images: { ...listingWritableProperties.images, default: [] },
      },
    },
    UpdateListingInput: {
      type: 'object',
      additionalProperties: false,
      properties: listingWritableProperties,
    },
    PaginatedListings: {
      type: 'object',
      additionalProperties: false,
      required: ['items', 'page', 'perPage', 'total'],
      properties: {
        items: { type: 'array', items: schemaRef('Listing') },
        page: { type: 'integer' },
        perPage: { type: 'integer' },
        total: { type: 'integer' },
      },
    },
    RoommatePreferences: {
      type: 'object',
      additionalProperties: false,
      properties: {
        gender: {
          type: 'string',
          enum: ['ANY', 'WOMEN_ONLY', 'MEN_ONLY'],
        },
        smoking: { type: 'boolean' },
        pets: { type: 'boolean' },
        quietHoursFrom: { type: 'string', minLength: 1, maxLength: 10 },
        budgetMinCents: {
          type: 'integer',
          minimum: 0,
          maximum: 50_000_000,
        },
        budgetMaxCents: {
          type: 'integer',
          minimum: 0,
          maximum: 50_000_000,
        },
        ageMin: { type: 'integer', minimum: 16, maximum: 120 },
        ageMax: { type: 'integer', minimum: 16, maximum: 120 },
        occupation: { type: 'string', minLength: 1, maxLength: 120 },
        environment: { type: 'string', minLength: 1, maxLength: 200 },
      },
    },
    UpdateProfileInput: {
      type: 'object',
      additionalProperties: false,
      properties: {
        displayName: { type: 'string', minLength: 2, maxLength: 120 },
        bio: { type: ['string', 'null'], maxLength: 2000, description: '`null` clears it.' },
        phoneNumber: {
          type: ['string', 'null'],
          minLength: 3,
          maxLength: 40,
          description: '`null` clears it.',
        },
        citySlug: {
          type: ['string', 'null'],
          minLength: 2,
          maxLength: 80,
          description: '`null` clears it.',
        },
        neighborhoodSlug: {
          type: ['string', 'null'],
          minLength: 2,
          maxLength: 100,
          description: '`null` clears it.',
        },
        avatarUrl: {
          anyOf: [uploadedImageUrlSchema, { type: 'null' }],
          description:
            'An uploaded photo URL (see `POST /api/uploads`); `null` removes the photo.',
        },
        publicContactAllowed: { type: 'boolean' },
        traits: {
          type: 'array',
          maxItems: PROFILE_TRAITS.length,
          items: profileTraitSchema,
          description: 'Lifestyle tags. Stored once each, in vocabulary order.',
        },
        languages: {
          type: 'array',
          maxItems: 20,
          items: { type: 'string', minLength: 1, maxLength: 80 },
        },
        roommatePreferences: schemaRef('RoommatePreferences'),
        lookingForRoom: {
          type: 'boolean',
          description: 'Publishes a "room wanted" post: owners can then message this profile directly.',
        },
        moveInDate: { anyOf: [calendarDateSchema, { type: 'null' }] },
        stayMonths: nullableStaySchema,
        wantedNeighborhoods: {
          type: 'array',
          maxItems: 20,
          items: { type: 'string', minLength: 2, maxLength: 100 },
          description:
            'Neighborhood slugs in the profile city (`INVALID_NEIGHBORHOOD` otherwise). A city change without a new list clears them.',
        },
      },
    },
    RoomWantedFields: {
      type: 'object',
      required: ['lookingForRoom', 'moveInDate', 'stayMonths', 'wantedNeighborhoods'],
      properties: {
        lookingForRoom: { type: 'boolean' },
        moveInDate: { anyOf: [calendarDateSchema, { type: 'null' }] },
        stayMonths: nullableIntegerSchema,
        wantedNeighborhoods: { type: 'array', items: { type: 'string' } },
      },
    },
    UserProfileRecord: {
      type: 'object',
      additionalProperties: false,
      required: [
        'userId',
        'displayName',
        'bio',
        'phoneNumber',
        'citySlug',
        'neighborhoodSlug',
        'avatarUrl',
        'isVerified',
        'emailVerified',
        'phoneVerified',
        'identityVerified',
        'publicContactAllowed',
        'traits',
        'languages',
        'roommatePreferences',
        'joinedAt',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        userId: { type: 'string' },
        displayName: { type: 'string' },
        bio: nullableStringSchema,
        phoneNumber: nullableStringSchema,
        citySlug: nullableStringSchema,
        neighborhoodSlug: nullableStringSchema,
        avatarUrl: nullableStringSchema,
        isVerified: { type: 'boolean' },
        emailVerified: { type: 'boolean' },
        phoneVerified: { type: 'boolean' },
        identityVerified: { type: 'boolean' },
        publicContactAllowed: { type: 'boolean' },
        traits: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } },
        roommatePreferences: schemaRef('RoommatePreferences'),
        joinedAt: dateTimeSchema,
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
      },
    },
    ReviewSummary: {
      type: 'object',
      additionalProperties: false,
      required: ['averageRating', 'reviewCount'],
      properties: {
        averageRating: { type: ['number', 'null'], minimum: 1, maximum: 5 },
        reviewCount: { type: 'integer', minimum: 0 },
      },
    },
    PublicProfile: {
      type: 'object',
      additionalProperties: false,
      required: [
        'userId',
        'displayName',
        'avatarUrl',
        'bio',
        'citySlug',
        'neighborhoodSlug',
        'isVerified',
        'emailVerified',
        'phoneVerified',
        'identityVerified',
        'traits',
        'languages',
        'roommatePreferences',
        'lookingForRoom',
        'moveInDate',
        'stayMonths',
        'wantedNeighborhoods',
        'joinedAt',
        'activeListingCount',
        'reviews',
      ],
      properties: {
        userId: { type: 'string' },
        displayName: { type: 'string' },
        avatarUrl: nullableStringSchema,
        bio: nullableStringSchema,
        citySlug: nullableStringSchema,
        neighborhoodSlug: nullableStringSchema,
        isVerified: { type: 'boolean' },
        emailVerified: { type: 'boolean' },
        phoneVerified: { type: 'boolean' },
        identityVerified: { type: 'boolean' },
        traits: { type: 'array', items: profileTraitSchema },
        languages: { type: 'array', items: { type: 'string' } },
        roommatePreferences: schemaRef('RoommatePreferences'),
        lookingForRoom: { type: 'boolean' },
        moveInDate: { anyOf: [calendarDateSchema, { type: 'null' }] },
        stayMonths: nullableIntegerSchema,
        wantedNeighborhoods: { type: 'array', items: { type: 'string' } },
        joinedAt: nullableDateTimeSchema,
        activeListingCount: { type: 'integer', minimum: 0 },
        reviews: schemaRef('ReviewSummary'),
      },
    },
    SavedProfile: {
      type: 'object',
      additionalProperties: false,
      required: ['profileUserId', 'savedAt', 'name', 'image', 'profile'],
      properties: {
        profileUserId: { type: 'string' },
        savedAt: dateTimeSchema,
        name: { type: 'string' },
        image: nullableStringSchema,
        profile: {
          anyOf: [schemaRef('UserProfileRecord'), { type: 'null' }],
        },
      },
    },
    ViewingRequest: {
      type: 'object',
      required: [
        'id',
        'listingId',
        'requesterId',
        'ownerId',
        'requestedStartAt',
        'message',
        'status',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string' },
        listingId: { type: 'string' },
        requesterId: { type: 'string' },
        ownerId: { type: 'string' },
        requestedStartAt: dateTimeSchema,
        message: nullableStringSchema,
        status: viewingRequestStatusSchema,
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
      },
    },
    ViewingRequestListItem: {
      allOf: [
        schemaRef('ViewingRequest'),
        {
          type: 'object',
          required: [
            'listingTitle',
            'listingCitySlug',
            'listingNeighborhoodSlug',
            'listingMonthlyRentCents',
            'listingCurrency',
            'listingCoverImageUrl',
            'requesterName',
            'ownerName',
            'ownerImage',
          ],
          properties: {
            listingTitle: { type: 'string' },
            listingCitySlug: { type: 'string' },
            listingNeighborhoodSlug: nullableStringSchema,
            listingMonthlyRentCents: { type: 'integer' },
            listingCurrency: { type: 'string' },
            listingCoverImageUrl: nullableStringSchema,
            requesterName: { type: 'string' },
            ownerName: { type: 'string' },
            ownerImage: nullableStringSchema,
          },
        },
      ],
    },
    CreateViewingRequestInput: {
      type: 'object',
      additionalProperties: false,
      required: ['requestedStartAt'],
      properties: {
        requestedStartAt: dateTimeSchema,
        message: { type: 'string', maxLength: 1000 },
      },
    },
    UpdateViewingRequestInput: {
      type: 'object',
      additionalProperties: false,
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['ACCEPTED', 'DECLINED', 'CANCELLED'],
        },
      },
    },
    CreateReviewInput: {
      oneOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['targetType', 'listingId', 'rating', 'body'],
          properties: {
            targetType: { const: 'LISTING' },
            listingId: { type: 'string', minLength: 1 },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            body: { type: 'string', minLength: 3, maxLength: 2000 },
          },
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['targetType', 'targetUserId', 'rating', 'body'],
          properties: {
            targetType: { const: 'USER' },
            targetUserId: { type: 'string', minLength: 1 },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            body: { type: 'string', minLength: 3, maxLength: 2000 },
          },
        },
      ],
      discriminator: { propertyName: 'targetType' },
    },
    Review: {
      type: 'object',
      additionalProperties: false,
      required: [
        'id',
        'reviewerId',
        'targetType',
        'targetUserId',
        'listingId',
        'reviewerRole',
        'rating',
        'body',
        'isPublished',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string' },
        reviewerId: { type: 'string' },
        targetType: { type: 'string', enum: ['LISTING', 'USER'] },
        targetUserId: nullableStringSchema,
        listingId: nullableStringSchema,
        reviewerRole: reviewerRoleSchema,
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        body: { type: 'string' },
        isPublished: { type: 'boolean' },
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
      },
    },
    ReviewListItem: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'rating', 'body', 'reviewerRole', 'createdAt', 'reviewer'],
      properties: {
        id: { type: 'string' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        body: { type: 'string' },
        reviewerRole: reviewerRoleSchema,
        createdAt: dateTimeSchema,
        reviewer: schemaRef('OwnerSummary'),
      },
    },
    PaginatedReviews: {
      type: 'object',
      additionalProperties: false,
      required: ['items', 'page', 'perPage', 'total', 'summary'],
      properties: {
        items: { type: 'array', items: schemaRef('ReviewListItem') },
        page: { type: 'integer' },
        perPage: { type: 'integer' },
        total: { type: 'integer' },
        summary: schemaRef('ReviewSummary'),
      },
    },
    CreateReportInput: {
      type: 'object',
      additionalProperties: false,
      anyOf: [{ required: ['listingId'] }, { required: ['reportedUserId'] }],
      required: ['reason'],
      properties: {
        listingId: { type: 'string', minLength: 1 },
        reportedUserId: { type: 'string', minLength: 1 },
        reason: { type: 'string', enum: [...REPORT_REASONS] },
        details: {
          type: 'string',
          maxLength: 2000,
          description: 'Required when reason is OTHER.',
        },
      },
    },
    Report: {
      type: 'object',
      additionalProperties: false,
      required: [
        'id',
        'reporterId',
        'listingId',
        'reportedUserId',
        'reason',
        'details',
        'status',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string' },
        reporterId: { type: 'string' },
        listingId: nullableStringSchema,
        reportedUserId: nullableStringSchema,
        reason: { type: 'string' },
        details: nullableStringSchema,
        status: {
          type: 'string',
          enum: ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'],
        },
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
      },
    },
    CreateConversationInput: {
      type: 'object',
      additionalProperties: false,
      description:
        'Either `{ listingId }` to ask a listing owner about their listing, or `{ recipientId, message, listingId? }` to write to someone with a "room wanted" post, optionally offering one of your own listings.',
      anyOf: [{ required: ['listingId'] }, { required: ['recipientId', 'message'] }],
      properties: {
        listingId: { type: 'string', minLength: 1 },
        recipientId: { type: 'string', minLength: 1 },
        message: { type: 'string', minLength: 1, maxLength: 2000 },
      },
    },
    BlockedUser: {
      type: 'object',
      additionalProperties: false,
      required: ['userId', 'name', 'image', 'blockedAt'],
      properties: {
        userId: { type: 'string' },
        name: { type: 'string' },
        image: nullableStringSchema,
        blockedAt: dateTimeSchema,
      },
    },
    Conversation: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'listingId', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string' },
        listingId: nullableStringSchema,
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
      },
    },
    CreateMessageInput: {
      type: 'object',
      additionalProperties: false,
      required: ['body'],
      properties: {
        body: { type: 'string', minLength: 1, maxLength: 2000 },
      },
    },
    Message: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'conversationId', 'senderId', 'body', 'createdAt'],
      properties: {
        id: { type: 'string' },
        conversationId: { type: 'string' },
        senderId: { type: 'string' },
        body: { type: 'string' },
        createdAt: dateTimeSchema,
      },
    },
    ConversationMessage: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'body', 'senderId', 'senderName', 'createdAt'],
      properties: {
        id: { type: 'string' },
        body: { type: 'string' },
        senderId: { type: 'string' },
        senderName: { type: 'string' },
        createdAt: dateTimeSchema,
      },
    },
    ConversationMessagesPage: {
      type: 'object',
      additionalProperties: false,
      required: ['items', 'nextCursor', 'nextCursorId', 'pollAfterMs'],
      properties: {
        items: { type: 'array', items: schemaRef('ConversationMessage') },
        nextCursor: nullableDateTimeSchema,
        nextCursorId: nullableStringSchema,
        pollAfterMs: { type: 'integer', const: 3000 },
      },
    },
  },
  securitySchemes: {
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'better-auth.session_token',
      description: 'Better Auth session cookie set after sign-in or sign-up.',
    },
  },
};

const jsonResponse = (description: string, schema: JsonObject): JsonObject => ({
  description,
  content: {
    'application/json': {
      schema,
    },
  },
});

const dataEnvelope = (data: JsonObject): JsonObject => ({
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: { data },
});

const dataResponse = (description: string, data: JsonObject): JsonObject =>
  jsonResponse(description, dataEnvelope(data));

const apiErrorResponse = (description: string): JsonObject =>
  jsonResponse(description, schemaRef('ApiError'));

const rateLimitedResponse: JsonObject = {
  ...apiErrorResponse(
    'Too many requests (`RATE_LIMITED`). Retry after the number of seconds in `Retry-After`, also given as `details.retryAfterSeconds`.',
  ),
  headers: {
    'Retry-After': {
      description: 'Seconds until the rate-limit window resets.',
      schema: { type: 'integer', minimum: 1 },
    },
  },
};

const errorDescriptions: Record<number, string> = {
  400: 'Invalid JSON, invalid parameters, failed validation, or invalid operation.',
  401: 'A valid session cookie is required.',
  403: 'The signed-in user is not allowed to perform this operation.',
  404: 'The requested resource was not found.',
  409: 'The operation conflicts with the current resource state.',
  500: 'An unexpected server error occurred.',
  503: 'The feature is not configured on this deployment.',
};

const responseSet = (
  success: Record<string, JsonObject>,
  statuses: number[] = [],
): Record<string, JsonObject> => ({
  ...success,
  ...Object.fromEntries(
    [...new Set([...statuses, 500])].map((status) => [
      String(status),
      apiErrorResponse(errorDescriptions[status]),
    ]),
  ),
});

const jsonBody = (schemaName: string): JsonObject => ({
  required: true,
  content: {
    'application/json': {
      schema: schemaRef(schemaName),
    },
  },
});

const idParameter = (description: string): JsonObject => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', minLength: 1 },
});

const pageParameters: JsonObject[] = [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 10_000, default: 1 },
  },
  {
    name: 'perPage',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
  },
];

const cookieSecurity = [{ cookieAuth: [] }];

const applicationPaths: Record<string, PathItem> = {
  '/api/me': {
    get: {
      tags: ['Session'],
      operationId: 'getCurrentUser',
      summary: 'Get the current user',
      description:
        'Returns the signed-in user or `null`. This route never returns 401 for an anonymous request.',
      security: [],
      responses: responseSet({
        '200': dataResponse('Current user lookup completed.', {
          anyOf: [schemaRef('User'), { type: 'null' }],
        }),
      }),
    },
  },
  '/api/me/blocks': {
    get: {
      tags: ['Blocks'],
      operationId: 'listBlockedUsers',
      summary: 'List the people you blocked',
      description: 'Newest first. Who blocked the caller is never disclosed.',
      security: cookieSecurity,
      responses: responseSet(
        {
          '200': dataResponse('Blocked users.', {
            type: 'object',
            additionalProperties: false,
            required: ['items'],
            properties: { items: { type: 'array', items: schemaRef('BlockedUser') } },
          }),
        },
        [401],
      ),
    },
  },
  '/api/me/export': {
    get: {
      tags: ['Session'],
      operationId: 'exportCurrentUserData',
      summary: "Download all of the current user's data",
      description:
        'GDPR access and portability: a JSON attachment (`stay-bg-data-YYYY-MM-DD.json`) with the account, profile, listings, saved listings and profiles, viewing requests, reviews, reports filed, conversations with messages, and sessions. Passwords, tokens and other secrets are never included. Not wrapped in `{ data }`.',
      security: cookieSecurity,
      responses: responseSet(
        {
          '200': {
            description: 'The export, sent as a file download.',
            headers: {
              'Content-Disposition': {
                description: 'Always `attachment` with a dated filename.',
                schema: { type: 'string' },
              },
            },
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
        [401],
      ),
    },
  },
  '/api/uploads': {
    post: {
      tags: ['Uploads'],
      operationId: 'createUploadToken',
      summary: 'Get a client token for a direct photo upload',
      description: `Implements the token half of the Vercel Blob client-upload protocol (\`@vercel/blob/client\`); the browser then uploads straight to Blob storage. The pathname must start with \`listings/\` or \`avatars/\`. The token allows ${IMAGE_UPLOAD.contentTypes.join(', ')} up to ${IMAGE_UPLOAD.maxBytes / 1024 / 1024} MB. The response is the Blob protocol body, not wrapped in \`{ data }\`.`,
      security: cookieSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'payload'],
              properties: {
                type: { type: 'string', enum: ['blob.generate-client-token'] },
                payload: {
                  type: 'object',
                  required: ['pathname'],
                  properties: {
                    pathname: { type: 'string', example: 'listings/living-room.jpg' },
                    clientPayload: { type: ['string', 'null'] },
                    multipart: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
      responses: responseSet(
        {
          '200': jsonResponse('A short-lived upload token.', {
            type: 'object',
            required: ['type', 'clientToken'],
            properties: {
              type: { type: 'string', enum: ['blob.generate-client-token'] },
              clientToken: { type: 'string' },
            },
          }),
        },
        [400, 401, 503],
      ),
    },
  },
  '/api/listings': {
    get: {
      tags: ['Listings'],
      operationId: 'listListings',
      summary: 'Search published listings',
      description: CONTACT_MASKING_NOTE,
      security: [],
      parameters: [
        {
          name: 'q',
          in: 'query',
          description: 'Case-insensitive title or description search.',
          schema: { type: 'string', minLength: 1, maxLength: 120 },
        },
        {
          name: 'citySlug',
          in: 'query',
          schema: { type: 'string', minLength: 2, maxLength: 80 },
        },
        {
          name: 'neighborhoodSlug',
          in: 'query',
          description: 'Comma-separated neighborhood slugs.',
          style: 'form',
          explode: false,
          schema: {
            type: 'array',
            minItems: 1,
            maxItems: 40,
            items: { type: 'string', minLength: 2, maxLength: 100 },
          },
        },
        {
          name: 'propertyType',
          in: 'query',
          description: 'Comma-separated property types.',
          style: 'form',
          explode: false,
          schema: {
            type: 'array',
            minItems: 1,
            maxItems: 4,
            items: propertyTypeSchema,
          },
        },
        {
          name: 'roommatePreference',
          in: 'query',
          schema: roommatePreferenceSchema,
        },
        {
          name: 'minRentCents',
          in: 'query',
          schema: { type: 'integer', minimum: 0 },
        },
        {
          name: 'maxRentCents',
          in: 'query',
          schema: { type: 'integer', minimum: 0 },
        },
        {
          name: 'bedroomCount',
          in: 'query',
          description: 'Minimum bedroom count.',
          schema: { type: 'integer', minimum: 0, maximum: 20 },
        },
        {
          name: 'maxOccupants',
          in: 'query',
          description: 'Minimum supported occupant count.',
          schema: { type: 'integer', minimum: 1, maximum: 30 },
        },
        {
          name: 'availableFrom',
          in: 'query',
          description:
            'Returns listings available on or before this date, plus listings with no availability date.',
          schema: dateTimeSchema,
        },
        {
          name: 'roomType',
          in: 'query',
          description: 'Comma-separated room types.',
          style: 'form',
          explode: false,
          schema: { type: 'array', minItems: 1, maxItems: 3, items: roomTypeSchema },
        },
        {
          name: 'stayMonths',
          in: 'query',
          description:
            "The seeker's planned stay: listings whose minimum and maximum stay admit it. A bound the owner did not set admits any stay.",
          schema: staySchema,
        },
        ...[
          'isVerified',
          'isFurnished',
          'internetIncluded',
          'utilitiesIncluded',
          'petsAllowed',
          'nearMetro',
          'roommateFriendly',
          'privateBathroom',
          'couplesAllowed',
          'smokingAllowed',
        ].map((name) => ({
          name,
          in: 'query',
          description: 'Accepts `true`, `false`, `1`, or `0`.',
          schema: { type: 'boolean' },
        })),
        {
          name: 'sort',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['newest', 'price-asc', 'price-desc'],
            default: 'newest',
          },
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 10_000,
            default: 1,
          },
        },
        {
          name: 'perPage',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            default: 20,
          },
        },
      ],
      responses: responseSet(
        {
          '200': dataResponse('A paginated listing result.', schemaRef('PaginatedListings')),
        },
        [400],
      ),
    },
    post: {
      tags: ['Listings'],
      operationId: 'createListing',
      summary: 'Create a listing',
      security: cookieSecurity,
      requestBody: jsonBody('CreateListingInput'),
      responses: responseSet(
        {
          '201': dataResponse('Listing created.', schemaRef('Listing')),
        },
        [400, 401],
      ),
    },
  },
  '/api/listings/{id}': {
    get: {
      tags: ['Listings'],
      operationId: 'getListing',
      summary: 'Get a published listing',
      description: CONTACT_MASKING_NOTE,
      security: [],
      parameters: [idParameter('Listing ID.')],
      responses: responseSet(
        {
          '200': dataResponse('Published listing.', schemaRef('Listing')),
        },
        [404],
      ),
    },
    patch: {
      tags: ['Listings'],
      operationId: 'updateListing',
      summary: 'Update an owned listing',
      security: cookieSecurity,
      parameters: [idParameter('Listing ID.')],
      requestBody: jsonBody('UpdateListingInput'),
      responses: responseSet(
        {
          '200': dataResponse('Updated listing.', schemaRef('Listing')),
        },
        [400, 401, 404],
      ),
    },
    delete: {
      tags: ['Listings'],
      operationId: 'archiveListing',
      summary: 'Archive an owned listing',
      description: 'Sets the listing status to `ARCHIVED`; it does not delete the row.',
      security: cookieSecurity,
      parameters: [idParameter('Listing ID.')],
      responses: responseSet({ '204': { description: 'Listing archived.' } }, [401, 404]),
    },
  },
  '/api/listings/{id}/favorite': {
    post: {
      tags: ['Favorites'],
      operationId: 'favoriteListing',
      summary: 'Save a listing',
      description: 'Idempotent: saving an already-saved listing still succeeds.',
      security: cookieSecurity,
      parameters: [idParameter('Listing ID.')],
      responses: responseSet(
        {
          '200': dataResponse('Listing saved.', {
            type: 'object',
            additionalProperties: false,
            required: ['favorited'],
            properties: { favorited: { type: 'boolean', const: true } },
          }),
        },
        [401, 404],
      ),
    },
    delete: {
      tags: ['Favorites'],
      operationId: 'unfavoriteListing',
      summary: 'Remove a saved listing',
      description: 'Idempotent: removing a listing that is not saved still succeeds.',
      security: cookieSecurity,
      parameters: [idParameter('Listing ID.')],
      responses: responseSet({ '204': { description: 'Saved listing removed.' } }, [401]),
    },
  },
  '/api/listings/{id}/similar': {
    get: {
      tags: ['Listings'],
      operationId: 'listSimilarListings',
      summary: 'List similar published listings',
      security: [],
      parameters: [
        idParameter('Source listing ID.'),
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 20, default: 6 },
        },
      ],
      responses: responseSet(
        {
          '200': dataResponse('Similar listings.', {
            type: 'object',
            additionalProperties: false,
            required: ['items'],
            properties: { items: { type: 'array', items: schemaRef('Listing') } },
          }),
        },
        [400, 404],
      ),
    },
  },
  '/api/listings/{id}/reviews': {
    get: {
      tags: ['Reviews'],
      operationId: 'listListingReviews',
      summary: 'List published reviews for a listing',
      security: [],
      parameters: [idParameter('Listing ID.'), ...pageParameters],
      responses: responseSet(
        {
          '200': dataResponse('Paginated reviews.', schemaRef('PaginatedReviews')),
        },
        [400],
      ),
    },
  },
  '/api/listings/{id}/viewing-requests': {
    post: {
      tags: ['Viewing requests'],
      operationId: 'createViewingRequest',
      summary: 'Request a listing viewing',
      description: 'The listing owner cannot request a viewing of their own listing.',
      security: cookieSecurity,
      parameters: [idParameter('Listing ID.')],
      requestBody: jsonBody('CreateViewingRequestInput'),
      responses: responseSet(
        {
          '201': dataResponse('Viewing request created.', schemaRef('ViewingRequest')),
        },
        [400, 401, 404],
      ),
    },
  },
  '/api/profiles/{id}': {
    get: {
      tags: ['Profiles'],
      operationId: 'getProfile',
      summary: 'Get a public profile',
      description: CONTACT_MASKING_NOTE,
      security: [],
      parameters: [idParameter('Profile user ID.')],
      responses: responseSet(
        {
          '200': dataResponse('Public profile.', schemaRef('PublicProfile')),
        },
        [404],
      ),
    },
    patch: {
      tags: ['Profiles'],
      operationId: 'updateProfile',
      summary: 'Update the signed-in user profile',
      description: 'The path ID must equal the signed-in user ID.',
      security: cookieSecurity,
      parameters: [idParameter('Profile user ID.')],
      requestBody: jsonBody('UpdateProfileInput'),
      responses: responseSet(
        {
          '200': dataResponse('Updated profile record.', schemaRef('UserProfileRecord')),
        },
        [400, 401, 403, 404],
      ),
    },
  },
  '/api/profiles/{id}/listings': {
    get: {
      tags: ['Profiles', 'Listings'],
      operationId: 'listProfileListings',
      summary: 'List a profile’s published listings',
      security: [],
      parameters: [idParameter('Profile user ID.')],
      responses: responseSet({
        '200': dataResponse('Published listings owned by the profile.', {
          type: 'object',
          additionalProperties: false,
          required: ['items'],
          properties: {
            items: { type: 'array', items: schemaRef('ListingWithImages') },
          },
        }),
      }),
    },
  },
  '/api/profiles/{id}/reviews': {
    get: {
      tags: ['Profiles', 'Reviews'],
      operationId: 'listProfileReviews',
      summary: 'List published reviews for a user',
      security: [],
      parameters: [idParameter('Profile user ID.'), ...pageParameters],
      responses: responseSet(
        {
          '200': dataResponse('Paginated reviews.', schemaRef('PaginatedReviews')),
        },
        [400],
      ),
    },
  },
  '/api/profiles/{id}/phone': {
    get: {
      tags: ['Profiles'],
      operationId: 'getProfilePhone',
      summary: 'Reveal a profile phone number',
      description:
        'The phone number is returned to its owner or when the profile allows public contact.',
      security: cookieSecurity,
      parameters: [idParameter('Profile user ID.')],
      responses: responseSet(
        {
          '200': dataResponse('Phone number.', {
            type: 'object',
            additionalProperties: false,
            required: ['phoneNumber'],
            properties: { phoneNumber: { type: 'string' } },
          }),
        },
        [401, 403, 404],
      ),
    },
  },
  '/api/profiles/{id}/favorite': {
    post: {
      tags: ['Favorites', 'Profiles'],
      operationId: 'favoriteProfile',
      summary: 'Save a profile',
      description: 'Idempotent for an already-saved profile. A user cannot save their own profile.',
      security: cookieSecurity,
      parameters: [idParameter('Profile user ID.')],
      responses: responseSet(
        {
          '200': dataResponse('Profile saved.', {
            type: 'object',
            additionalProperties: false,
            required: ['saved'],
            properties: { saved: { type: 'boolean', const: true } },
          }),
        },
        [400, 401, 404],
      ),
    },
    delete: {
      tags: ['Favorites', 'Profiles'],
      operationId: 'unfavoriteProfile',
      summary: 'Remove a saved profile',
      description: 'Idempotent: removing a profile that is not saved still succeeds.',
      security: cookieSecurity,
      parameters: [idParameter('Profile user ID.')],
      responses: responseSet({ '204': { description: 'Saved profile removed.' } }, [401]),
    },
  },
  '/api/profiles/{id}/block': {
    post: {
      tags: ['Blocks', 'Profiles'],
      operationId: 'blockUser',
      summary: 'Block a user',
      description:
        'Idempotent. While either person has blocked the other, neither can start a conversation, send a message, request a viewing or reveal the other\'s phone number (`403 USER_BLOCKED`). The blocked person is not notified.',
      security: cookieSecurity,
      parameters: [idParameter('User ID to block.')],
      responses: responseSet(
        {
          '200': dataResponse('User blocked.', {
            type: 'object',
            additionalProperties: false,
            required: ['blocked'],
            properties: { blocked: { type: 'boolean', const: true } },
          }),
        },
        [400, 401, 404],
      ),
    },
    delete: {
      tags: ['Blocks', 'Profiles'],
      operationId: 'unblockUser',
      summary: 'Unblock a user',
      description: 'Idempotent: unblocking someone who is not blocked still succeeds.',
      security: cookieSecurity,
      parameters: [idParameter('User ID to unblock.')],
      responses: responseSet({ '204': { description: 'User unblocked.' } }, [401]),
    },
  },
  '/api/favorites': {
    get: {
      tags: ['Favorites'],
      operationId: 'listFavorites',
      summary: 'List saved listings and profiles',
      security: cookieSecurity,
      responses: responseSet(
        {
          '200': dataResponse('Saved resources.', {
            type: 'object',
            additionalProperties: false,
            required: ['listings', 'profiles'],
            properties: {
              listings: { type: 'array', items: schemaRef('SavedListing') },
              profiles: { type: 'array', items: schemaRef('SavedProfile') },
            },
          }),
        },
        [401],
      ),
    },
  },
  '/api/viewing-requests': {
    get: {
      tags: ['Viewing requests'],
      operationId: 'listViewingRequests',
      summary: 'List viewing requests involving the signed-in user',
      security: cookieSecurity,
      parameters: [
        {
          name: 'role',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['requester', 'owner', 'all'],
            default: 'all',
          },
        },
      ],
      responses: responseSet(
        {
          '200': dataResponse('Viewing requests.', {
            type: 'object',
            additionalProperties: false,
            required: ['items'],
            properties: {
              items: {
                type: 'array',
                items: schemaRef('ViewingRequestListItem'),
              },
            },
          }),
        },
        [400, 401],
      ),
    },
  },
  '/api/viewing-requests/{id}': {
    patch: {
      tags: ['Viewing requests'],
      operationId: 'updateViewingRequest',
      summary: 'Accept, decline, or cancel a viewing request',
      description:
        'Only the listing owner may accept or decline. Only the requester may cancel. Invalid state transitions return 409.',
      security: cookieSecurity,
      parameters: [idParameter('Viewing request ID.')],
      requestBody: jsonBody('UpdateViewingRequestInput'),
      responses: responseSet(
        {
          '200': dataResponse('Viewing request updated.', schemaRef('ViewingRequest')),
        },
        [400, 401, 403, 404, 409],
      ),
    },
  },
  '/api/reviews': {
    post: {
      tags: ['Reviews'],
      operationId: 'createReview',
      summary: 'Create a listing or user review',
      description:
        'An accepted viewing request is required. A reviewer may review each target only once and cannot review themselves.',
      security: cookieSecurity,
      requestBody: jsonBody('CreateReviewInput'),
      responses: responseSet(
        {
          '201': dataResponse('Review created.', schemaRef('Review')),
        },
        [400, 401, 403, 404, 409],
      ),
    },
  },
  '/api/reports': {
    post: {
      tags: ['Reports'],
      operationId: 'createReport',
      summary: 'Report a listing, user, or both',
      security: cookieSecurity,
      requestBody: jsonBody('CreateReportInput'),
      responses: responseSet(
        {
          '201': dataResponse('Report created.', schemaRef('Report')),
        },
        [400, 401, 404],
      ),
    },
  },
  '/api/conversations': {
    get: {
      tags: ['Conversations'],
      operationId: 'listConversations',
      summary: 'List the signed-in user’s conversations',
      security: cookieSecurity,
      responses: responseSet(
        {
          '200': dataResponse('Conversations.', {
            type: 'object',
            additionalProperties: false,
            required: ['items'],
            properties: {
              items: { type: 'array', items: schemaRef('Conversation') },
            },
          }),
        },
        [401],
      ),
    },
    post: {
      tags: ['Conversations'],
      operationId: 'createConversation',
      summary: 'Start or retrieve a conversation',
      description:
        'One thread per pair of people per listing (or per pair with no listing): an existing one is returned. Writing without a listing, or offering your own, needs the recipient to have a "room wanted" post (`403 RECIPIENT_NOT_LOOKING`). A block either way returns `403 USER_BLOCKED`.',
      security: cookieSecurity,
      requestBody: jsonBody('CreateConversationInput'),
      responses: responseSet(
        {
          '201': dataResponse('Conversation returned.', schemaRef('Conversation')),
        },
        [400, 401, 403, 404],
      ),
    },
  },
  '/api/conversations/{id}/messages': {
    get: {
      tags: ['Conversations'],
      operationId: 'listConversationMessages',
      summary: 'Poll messages in a conversation',
      description:
        '`afterId` may only be sent with `after`. Results are ordered by creation time and ID.',
      security: cookieSecurity,
      parameters: [
        idParameter('Conversation ID.'),
        {
          name: 'after',
          in: 'query',
          description: 'Return messages created after this timestamp.',
          schema: dateTimeSchema,
        },
        {
          name: 'afterId',
          in: 'query',
          description: 'Cursor tiebreaker; requires `after`.',
          schema: { type: 'string', minLength: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        },
      ],
      responses: responseSet(
        {
          '200': dataResponse(
            'Messages and the next polling cursor.',
            schemaRef('ConversationMessagesPage'),
          ),
        },
        [400, 401, 403],
      ),
    },
    post: {
      tags: ['Conversations'],
      operationId: 'createMessage',
      summary: 'Send a conversation message',
      security: cookieSecurity,
      parameters: [idParameter('Conversation ID.')],
      requestBody: jsonBody('CreateMessageInput'),
      responses: responseSet(
        {
          '201': dataResponse('Message created.', schemaRef('Message')),
        },
        [400, 401, 403],
      ),
    },
  },
};

/**
 * Operations that call `enforceRateLimit` (`lib/server/rate-limit.ts`), so each can
 * answer 429. Listed by operation id and checked below, so a renamed operation fails
 * generation instead of silently losing its 429.
 */
const RATE_LIMITED_OPERATIONS = new Set([
  'exportCurrentUserData',
  'createUploadToken',
  'createListing',
  'updateListing',
  'archiveListing',
  'favoriteListing',
  'unfavoriteListing',
  'createViewingRequest',
  'updateProfile',
  'favoriteProfile',
  'unfavoriteProfile',
  'blockUser',
  'unblockUser',
  'updateViewingRequest',
  'createReview',
  'createReport',
  'createConversation',
  'createMessage',
]);

function addRateLimitResponses(paths: Record<string, PathItem>) {
  const seen = new Set<string>();

  for (const pathItem of Object.values(paths)) {
    for (const operation of Object.values(pathItem)) {
      const id = operation.operationId as string;
      if (!RATE_LIMITED_OPERATIONS.has(id)) continue;

      const responses = operation.responses as Record<string, JsonObject>;
      responses['429'] = rateLimitedResponse;
      seen.add(id);
    }
  }

  const missing = [...RATE_LIMITED_OPERATIONS].filter((id) => !seen.has(id));
  if (missing.length > 0) {
    throw new Error(`Rate-limited operations not found: ${missing.join(', ')}`);
  }
}

/**
 * Better Auth owns a catch-all App Router handler. Its package already ships
 * exact OpenAPI metadata for the installed version, so derive that section
 * instead of hand-copying route schemas that would drift after an upgrade.
 *
 * A database adapter is not needed to generate metadata. Keep the behavioral
 * options aligned with `lib/auth.ts`; the generated artifact is then merged
 * with the application route-handler operations above.
 */
async function getAuthenticationPaths() {
  const documentationAuth = betterAuth({
    appName: 'Stay.bg',
    baseURL: 'http://localhost:3000',
    secret: 'openapi-generation-only-secret-at-least-32-characters',
    // Callbacks are no-ops: only their presence changes which routes Better Auth mounts.
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      requireEmailVerification: true,
      sendResetPassword: async () => {},
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async () => {},
    },
    user: {
      additionalFields: {
        locale: { type: 'string', required: false, defaultValue: 'bg', input: true },
      },
      deleteUser: { enabled: true },
    },
    plugins: [nextCookies()],
  });

  const context = await documentationAuth.$context;
  const authSpec = await generateBetterAuthOpenApi(context, context.options);
  const authPaths: Record<string, PathItem> = {};

  const publicAuthPaths = new Set([
    '/sign-in/social',
    '/callback/{id}',
    '/get-session',
    '/sign-up/email',
    '/sign-in/email',
    '/reset-password',
    '/verify-email',
    '/send-verification-email',
    '/request-password-reset',
    '/reset-password/{token}',
    '/delete-user/callback',
    '/ok',
    '/error',
  ]);

  const configurationDependentPaths = new Set([
    '/sign-in/social',
    '/callback/{id}',
    '/link-social',
    '/refresh-token',
    '/get-access-token',
  ]);

  for (const [path, pathItem] of Object.entries(authSpec.paths)) {
    const normalizedPath = `/api/auth${path}`;
    const normalizedItem: PathItem = {};

    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (!rawOperation) {
        continue;
      }

      const operation = rawOperation as JsonObject;
      const generatedDescription =
        typeof operation.description === 'string' ? operation.description : undefined;
      const configurationNote = configurationDependentPaths.has(path)
        ? ' This core route is mounted, but it needs a social sign-in provider, and the current app config enables none.'
        : '';

      normalizedItem[method] = {
        ...operation,
        tags: ['Authentication'],
        description: `${generatedDescription ?? 'Better Auth core endpoint.'}${configurationNote}`,
        security: publicAuthPaths.has(path) ? [] : cookieSecurity,
      };

      if (path === '/get-session' && method === 'post') {
        normalizedItem[method] = {
          ...normalizedItem[method],
          deprecated: true,
          description:
            'Better Auth declares this method for deferred session refresh. The current app does not enable deferred refresh, so callers should use GET.',
        };
      }
    }

    authPaths[normalizedPath] = normalizedItem;
  }

  return {
    paths: authPaths,
    schemas: authSpec.components.schemas as Record<string, JsonObject>,
  };
}

async function main() {
  addRateLimitResponses(applicationPaths);
  const authentication = await getAuthenticationPaths();
  const componentSchemas = components.schemas as Record<string, JsonObject>;

  const openApiDocument = {
    openapi: '3.1.1',
    info: {
      title: 'Stay.bg Backend API',
      version: '0.1.0',
      description:
        'OpenAPI documentation for the Stay.bg Next.js route-handler API and the concrete Better Auth routes mounted under `/api/auth`. Application routes return `{ data: ... }` on success and `{ error: { code, message, details? } }` on failure. Better Auth routes use Better Auth’s native response envelopes. Admin routes (`/api/admin/*` and the Better Auth admin plugin) are intentionally excluded; they return 404 to non-admins and are documented in docs/README.backend.md.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description:
          'Better Auth core endpoints. Email/password sign-up and sign-in are enabled; sign-in requires a verified email address. Verification and password-reset emails are sent through Resend. Social-provider routes are mounted by Better Auth but no provider is configured.',
      },
      { name: 'Session', description: 'Application-level session lookup and data export.' },
      { name: 'Uploads', description: 'Direct-to-storage photo uploads.' },
      { name: 'Listings' },
      { name: 'Profiles' },
      { name: 'Favorites' },
      { name: 'Viewing requests' },
      { name: 'Reviews' },
      { name: 'Reports' },
      { name: 'Conversations' },
      { name: 'Blocks' },
    ],
    paths: {
      ...applicationPaths,
      ...authentication.paths,
    },
    components: {
      ...components,
      schemas: {
        ...authentication.schemas,
        ...componentSchemas,
      },
    },
  };

  const outputPath = resolve(process.cwd(), 'docs', 'openapi.json');
  await writeFile(outputPath, `${JSON.stringify(openApiDocument, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
