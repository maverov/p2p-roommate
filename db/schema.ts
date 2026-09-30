import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  // Owned by the Better Auth admin plugin (lib/auth.ts), which never lets users write them.
  role: text('role'),
  banned: boolean('banned').default(false).notNull(),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),
  /** The language emails are written in. Set at sign-up, changed in settings (`lib/auth.ts`). */
  locale: text('locale').default('bg').notNull(),
  ...timestamps,
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    impersonatedBy: text('impersonated_by'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    ...timestamps,
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

/**
 * Better Auth's rate-limit store (`rateLimit.storage: 'database'` in `lib/auth.ts`).
 * The default in-memory store is per process, so on serverless every instance would
 * count separately and the limit would never trip.
 */
export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

/** Fixed-window counters for the app's own API routes (`lib/server/rate-limit.ts`). */
export const apiRateLimits = pgTable('api_rate_limit', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});

export const listingStatus = pgEnum('listing_status', [
  'DRAFT',
  'PUBLISHED',
  'PAUSED',
  'ARCHIVED',
]);

export const propertyType = pgEnum('property_type', [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'ROOM',
]);

export const roommatePreference = pgEnum('roommate_preference', [
  'ANY',
  'STUDENTS',
  'PROFESSIONALS',
  'WOMEN_ONLY',
  'MEN_ONLY',
]);

export const roomType = pgEnum('room_type', ['SINGLE', 'DOUBLE', 'SHARED']);

export const reportStatus = pgEnum('report_status', [
  'OPEN',
  'REVIEWING',
  'RESOLVED',
  'DISMISSED',
]);

export const viewingRequestStatus = pgEnum('viewing_request_status', [
  'REQUESTED',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
]);

export const reviewTargetType = pgEnum('review_target_type', [
  'LISTING',
  'USER',
]);

export const reviewerRole = pgEnum('reviewer_role', [
  'TENANT',
  'OWNER',
]);

export const userProfiles = pgTable(
  'user_profile',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    bio: text('bio'),
    phoneNumber: text('phone_number'),
    citySlug: text('city_slug'),
    neighborhoodSlug: text('neighborhood_slug'),
    avatarUrl: text('avatar_url'),
    isVerified: boolean('is_verified').default(false).notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    phoneVerified: boolean('phone_verified').default(false).notNull(),
    identityVerified: boolean('identity_verified').default(false).notNull(),
    publicContactAllowed: boolean('public_contact_allowed')
      .default(false)
      .notNull(),
    /** `PROFILE_TRAITS` ids. Read through `parseProfileTraits`: older rows may hold free text. */
    traits: jsonb('traits').$type<string[]>().default([]).notNull(),
    languages: jsonb('languages').$type<string[]>().default([]).notNull(),
    roommatePreferences: jsonb('roommate_preferences')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    /**
     * A published "room wanted" post: owners can find this profile and message it
     * without a listing of its own. The budget lives in `roommatePreferences`.
     */
    lookingForRoom: boolean('looking_for_room').default(false).notNull(),
    /** Calendar date (no time zone), `YYYY-MM-DD`. */
    moveInDate: date('move_in_date', { mode: 'string' }),
    stayMonths: integer('stay_months'),
    /** Neighbourhood slugs within `citySlug`. */
    wantedNeighborhoods: jsonb('wanted_neighborhoods').$type<string[]>().default([]).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index('user_profile_city_idx').on(table.citySlug),
    index('user_profile_verified_idx').on(table.isVerified),
    index('user_profile_looking_city_idx').on(table.lookingForRoom, table.citySlug),
    // Serves the find-roommate lifestyle filter (`traits @> '[...]'`).
    index('user_profile_traits_idx').using('gin', table.traits),
    check('user_profile_stay_months_range', sql`${table.stayMonths} BETWEEN 1 AND 60`),
  ],
);

export const listings = pgTable(
  'listing',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: listingStatus('status').default('DRAFT').notNull(),
    propertyType: propertyType('property_type').notNull(),
    roommatePreference: roommatePreference('roommate_preference')
      .default('ANY')
      .notNull(),
    citySlug: text('city_slug').notNull(),
    neighborhoodSlug: text('neighborhood_slug'),
    addressLine: text('address_line'),
    monthlyRentCents: integer('monthly_rent_cents').notNull(),
    depositCents: integer('deposit_cents'),
    /** Always `PLATFORM_CURRENCY` (`lib/currency.ts`); see `listing_currency_eur`. */
    currency: text('currency').default('EUR').notNull(),
    bedroomCount: integer('bedroom_count').notNull(),
    bathroomCount: integer('bathroom_count').notNull(),
    maxOccupants: integer('max_occupants').notNull(),
    sizeSqm: integer('size_sqm'),
    floor: integer('floor'),
    totalFloors: integer('total_floors'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    isVerified: boolean('is_verified').default(false).notNull(),
    isFurnished: boolean('is_furnished').default(false).notNull(),
    internetIncluded: boolean('internet_included').default(false).notNull(),
    utilitiesIncluded: boolean('utilities_included').default(false).notNull(),
    petsAllowed: boolean('pets_allowed').default(false).notNull(),
    nearMetro: boolean('near_metro').default(false).notNull(),
    roommateFriendly: boolean('roommate_friendly').default(false).notNull(),
    /** The room on offer; null for whole-property listings. */
    roomType: roomType('room_type'),
    privateBathroom: boolean('private_bathroom').default(false).notNull(),
    couplesAllowed: boolean('couples_allowed').default(false).notNull(),
    smokingAllowed: boolean('smoking_allowed').default(false).notNull(),
    minStayMonths: integer('min_stay_months'),
    maxStayMonths: integer('max_stay_months'),
    /** Who lives there now and how (`listingHouseholdSchema`); display only, never filtered. */
    household: jsonb('household').$type<Record<string, unknown>>().default({}).notNull(),
    availableFrom: timestamp('available_from', { withTimezone: true }),
    amenities: jsonb('amenities').$type<string[]>().default([]).notNull(),
    rules: jsonb('rules').$type<string[]>().default([]).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('listing_owner_id_idx').on(table.ownerId),
    index('listing_city_status_idx').on(table.citySlug, table.status),
    index('listing_neighborhood_idx').on(table.neighborhoodSlug),
    index('listing_price_idx').on(table.monthlyRentCents),
    index('listing_verified_idx').on(table.isVerified),
    index('listing_available_from_idx').on(table.availableFrom),
    index('listing_status_published_idx').on(table.status, table.publishedAt),
    check('listing_monthly_rent_positive', sql`${table.monthlyRentCents} > 0`),
    check('listing_deposit_nonnegative', sql`${table.depositCents} >= 0`),
    check('listing_currency_eur', sql`${table.currency} = 'EUR'`),
    check('listing_min_stay_range', sql`${table.minStayMonths} BETWEEN 1 AND 60`),
    check('listing_max_stay_range', sql`${table.maxStayMonths} BETWEEN 1 AND 60`),
    check(
      'listing_stay_order',
      sql`${table.minStayMonths} IS NULL OR ${table.maxStayMonths} IS NULL OR ${table.minStayMonths} <= ${table.maxStayMonths}`,
    ),
  ],
);

export const listingImages = pgTable(
  'listing_image',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: text('alt').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index('listing_image_listing_id_idx').on(table.listingId),
    uniqueIndex('listing_image_sort_order_unique').on(
      table.listingId,
      table.sortOrder,
    ),
  ],
);

export const favorites = pgTable(
  'favorite',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.listingId] }),
    index('favorite_listing_id_idx').on(table.listingId),
  ],
);

export const savedProfiles = pgTable(
  'saved_profile',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    profileUserId: text('profile_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.profileUserId] }),
    index('saved_profile_profile_user_id_idx').on(table.profileUserId),
  ],
);

/**
 * One row per "A blocked B". Stored one-way so each side's list is their own, but
 * enforced both ways: neither person can message or request a viewing from the other.
 */
export const userBlocks = pgTable(
  'user_block',
  {
    blockerId: text('blocker_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    blockedId: text('blocked_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    index('user_block_blocked_id_idx').on(table.blockedId),
    check('user_block_not_self', sql`${table.blockerId} <> ${table.blockedId}`),
  ],
);

export const viewingRequests = pgTable(
  'viewing_request',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    requesterId: text('requester_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requestedStartAt: timestamp('requested_start_at', {
      withTimezone: true,
    }).notNull(),
    message: text('message'),
    status: viewingRequestStatus('status').default('REQUESTED').notNull(),
    ...timestamps,
  },
  (table) => [
    index('viewing_request_listing_id_idx').on(table.listingId),
    index('viewing_request_requester_id_idx').on(table.requesterId),
    index('viewing_request_owner_id_idx').on(table.ownerId),
    index('viewing_request_status_idx').on(table.status),
  ],
);

export const reviews = pgTable(
  'review',
  {
    id: text('id').primaryKey(),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    targetType: reviewTargetType('target_type').notNull(),
    targetUserId: text('target_user_id').references(() => user.id, {
      onDelete: 'cascade',
    }),
    listingId: text('listing_id').references(() => listings.id, {
      onDelete: 'cascade',
    }),
    reviewerRole: reviewerRole('reviewer_role').notNull(),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index('review_reviewer_id_idx').on(table.reviewerId),
    index('review_target_user_id_idx').on(table.targetUserId),
    index('review_listing_id_idx').on(table.listingId),
    index('review_target_type_idx').on(table.targetType),
    uniqueIndex('review_listing_reviewer_unique')
      .on(table.reviewerId, table.listingId)
      .where(sql`${table.targetType} = 'LISTING'`),
    uniqueIndex('review_user_reviewer_unique')
      .on(table.reviewerId, table.targetUserId)
      .where(sql`${table.targetType} = 'USER'`),
    check(
      'review_target_columns_check',
      sql`(
        (${table.targetType} = 'LISTING' AND ${table.listingId} IS NOT NULL AND ${table.targetUserId} IS NULL)
        OR
        (${table.targetType} = 'USER' AND ${table.targetUserId} IS NOT NULL AND ${table.listingId} IS NULL)
      )`,
    ),
    check('review_rating_range', sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export const conversations = pgTable(
  'conversation',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id').references(() => listings.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (table) => [index('conversation_listing_id_idx').on(table.listingId)],
);

export const conversationParticipants = pgTable(
  'conversation_participant',
  {
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index('conversation_participant_user_id_idx').on(table.userId),
  ],
);

export const messages = pgTable(
  'message',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('message_conversation_created_at_idx').on(
      table.conversationId,
      table.createdAt,
    ),
    index('message_sender_id_idx').on(table.senderId),
  ],
);

export const reports = pgTable(
  'report',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    listingId: text('listing_id').references(() => listings.id, {
      onDelete: 'set null',
    }),
    reportedUserId: text('reported_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: reportStatus('status').default('OPEN').notNull(),
    resolvedById: text('resolved_by').references(() => user.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNote: text('resolution_note'),
    ...timestamps,
  },
  (table) => [
    index('report_reporter_id_idx').on(table.reporterId),
    index('report_listing_id_idx').on(table.listingId),
    index('report_reported_user_id_idx').on(table.reportedUserId),
    index('report_status_idx').on(table.status),
  ],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ViewingRequest = typeof viewingRequests.$inferSelect;
export type NewViewingRequest = typeof viewingRequests.$inferInsert;
