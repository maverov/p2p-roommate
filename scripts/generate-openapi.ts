import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

import { generator as generateBetterAuthOpenApi } from '../node_modules/better-auth/dist/plugins/open-api/generator.mjs';

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
    minLength: 3,
    maxLength: 3,
    example: 'BGN',
  },
  bedroomCount: { type: 'integer', minimum: 0, maximum: 20 },
  bathroomCount: { type: 'integer', minimum: 0, maximum: 20 },
  maxOccupants: { type: 'integer', minimum: 1, maximum: 30 },
  sizeSqm: { type: 'integer', minimum: 1, maximum: 5000 },
  floor: { type: 'integer', minimum: -5, maximum: 200 },
  totalFloors: { type: 'integer', minimum: 0, maximum: 200 },
  latitude: { type: 'number', minimum: -90, maximum: 90 },
  longitude: { type: 'number', minimum: -180, maximum: 180 },
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
        url: { type: 'string', format: 'uri', maxLength: 2048 },
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
        currency: { type: 'string' },
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
          default: 'BGN',
        },
        isFurnished: { type: 'boolean', default: false },
        internetIncluded: { type: 'boolean', default: false },
        utilitiesIncluded: { type: 'boolean', default: false },
        petsAllowed: { type: 'boolean', default: false },
        nearMetro: { type: 'boolean', default: false },
        roommateFriendly: { type: 'boolean', default: false },
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
        bio: { type: 'string', maxLength: 2000 },
        phoneNumber: { type: 'string', minLength: 3, maxLength: 40 },
        citySlug: { type: 'string', minLength: 2, maxLength: 80 },
        neighborhoodSlug: { type: 'string', minLength: 2, maxLength: 100 },
        avatarUrl: { type: 'string', format: 'uri', maxLength: 2048 },
        publicContactAllowed: { type: 'boolean' },
        traits: {
          type: 'array',
          maxItems: 50,
          items: { type: 'string', minLength: 1, maxLength: 80 },
        },
        languages: {
          type: 'array',
          maxItems: 20,
          items: { type: 'string', minLength: 1, maxLength: 80 },
        },
        roommatePreferences: schemaRef('RoommatePreferences'),
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
        'responseTimeMinutes',
        'responseRate',
        'successfulRentals',
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
        responseTimeMinutes: { type: 'integer' },
        responseRate: { type: 'integer' },
        successfulRentals: { type: 'integer' },
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
        'responseTimeMinutes',
        'responseRate',
        'successfulRentals',
        'traits',
        'languages',
        'roommatePreferences',
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
        responseTimeMinutes: { type: 'integer' },
        responseRate: { type: 'integer' },
        successfulRentals: { type: 'integer' },
        traits: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } },
        roommatePreferences: schemaRef('RoommatePreferences'),
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
    CreateSavedSearchInput: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'filters'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 120 },
        filters: { type: 'object', additionalProperties: true },
        notificationsEnabled: { type: 'boolean', default: true },
      },
    },
    UpdateSavedSearchInput: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 120 },
        filters: { type: 'object', additionalProperties: true },
        notificationsEnabled: { type: 'boolean' },
      },
    },
    SavedSearch: {
      type: 'object',
      additionalProperties: false,
      required: [
        'id',
        'userId',
        'name',
        'filters',
        'notificationsEnabled',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        name: { type: 'string' },
        filters: { type: 'object', additionalProperties: true },
        notificationsEnabled: { type: 'boolean' },
        createdAt: dateTimeSchema,
        updatedAt: dateTimeSchema,
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
          required: ['listingTitle', 'requesterName'],
          properties: {
            listingTitle: { type: 'string' },
            requesterName: { type: 'string' },
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
        reason: { type: 'string', minLength: 3, maxLength: 120 },
        details: { type: 'string', maxLength: 2000 },
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
      required: ['listingId'],
      properties: {
        listingId: { type: 'string', minLength: 1 },
        message: { type: 'string', minLength: 1, maxLength: 2000 },
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

const errorDescriptions: Record<number, string> = {
  400: 'Invalid JSON, invalid parameters, failed validation, or invalid operation.',
  401: 'A valid session cookie is required.',
  403: 'The signed-in user is not allowed to perform this operation.',
  404: 'The requested resource was not found.',
  409: 'The operation conflicts with the current resource state.',
  500: 'An unexpected server error occurred.',
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
  '/api/listings': {
    get: {
      tags: ['Listings'],
      operationId: 'listListings',
      summary: 'Search published listings',
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
        ...[
          'isVerified',
          'isFurnished',
          'internetIncluded',
          'utilitiesIncluded',
          'petsAllowed',
          'nearMetro',
          'roommateFriendly',
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
  '/api/saved-searches': {
    get: {
      tags: ['Saved searches'],
      operationId: 'listSavedSearches',
      summary: 'List the signed-in user’s saved searches',
      security: cookieSecurity,
      responses: responseSet(
        {
          '200': dataResponse('Saved searches.', {
            type: 'object',
            additionalProperties: false,
            required: ['items'],
            properties: {
              items: { type: 'array', items: schemaRef('SavedSearch') },
            },
          }),
        },
        [401],
      ),
    },
    post: {
      tags: ['Saved searches'],
      operationId: 'createSavedSearch',
      summary: 'Create a saved search',
      security: cookieSecurity,
      requestBody: jsonBody('CreateSavedSearchInput'),
      responses: responseSet(
        {
          '201': dataResponse('Saved search created.', schemaRef('SavedSearch')),
        },
        [400, 401],
      ),
    },
  },
  '/api/saved-searches/{id}': {
    patch: {
      tags: ['Saved searches'],
      operationId: 'updateSavedSearch',
      summary: 'Update an owned saved search',
      security: cookieSecurity,
      parameters: [idParameter('Saved search ID.')],
      requestBody: jsonBody('UpdateSavedSearchInput'),
      responses: responseSet(
        {
          '200': dataResponse('Saved search updated.', schemaRef('SavedSearch')),
        },
        [400, 401, 404],
      ),
    },
    delete: {
      tags: ['Saved searches'],
      operationId: 'deleteSavedSearch',
      summary: 'Delete an owned saved search',
      description: 'Idempotent: deleting a missing or non-owned saved search still succeeds.',
      security: cookieSecurity,
      parameters: [idParameter('Saved search ID.')],
      responses: responseSet({ '204': { description: 'Saved search deleted.' } }, [401]),
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
      summary: 'Start or retrieve a listing conversation',
      description:
        'Returns the existing conversation when the same user already has one for the listing. Listing owners cannot message their own listing.',
      security: cookieSecurity,
      requestBody: jsonBody('CreateConversationInput'),
      responses: responseSet(
        {
          '201': dataResponse('Conversation returned.', schemaRef('Conversation')),
        },
        [400, 401, 404],
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
    emailAndPassword: {
      enabled: true,
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
    '/request-password-reset',
    '/reset-password/{token}',
    '/reset-password',
    '/verify-email',
    '/send-verification-email',
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
        ? ' This core route is mounted, but it requires matching email-delivery or social-provider configuration to be useful; the current app config does not provide that integration.'
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
  const authentication = await getAuthenticationPaths();
  const componentSchemas = components.schemas as Record<string, JsonObject>;

  const openApiDocument = {
    openapi: '3.1.1',
    info: {
      title: 'Stay.bg Backend API',
      version: '0.1.0',
      description:
        'OpenAPI documentation for the Stay.bg Next.js route-handler API and the concrete Better Auth routes mounted under `/api/auth`. Application routes return `{ data: ... }` on success and `{ error: { code, message, details? } }` on failure. Better Auth routes use Better Auth’s native response envelopes.',
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
          'Better Auth core endpoints. Email/password sign-up and sign-in are enabled. Routes involving social providers, verification email delivery, or password-reset email delivery are mounted by Better Auth but require additional callbacks/providers that are not currently configured.',
      },
      { name: 'Session', description: 'Application-level session lookup.' },
      { name: 'Listings' },
      { name: 'Profiles' },
      { name: 'Favorites' },
      { name: 'Saved searches' },
      { name: 'Viewing requests' },
      { name: 'Reviews' },
      { name: 'Reports' },
      { name: 'Conversations' },
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
