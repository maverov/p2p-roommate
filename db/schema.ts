import {
  boolean,
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
    responseTimeMinutes: integer('response_time_minutes').default(120).notNull(),
    responseRate: integer('response_rate').default(0).notNull(),
    successfulRentals: integer('successful_rentals').default(0).notNull(),
    traits: jsonb('traits').$type<string[]>().default([]).notNull(),
    languages: jsonb('languages').$type<string[]>().default([]).notNull(),
    roommatePreferences: jsonb('roommate_preferences')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index('user_profile_city_idx').on(table.citySlug),
    index('user_profile_verified_idx').on(table.isVerified),
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

export const savedSearches = pgTable(
  'saved_search',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    filters: jsonb('filters').$type<Record<string, unknown>>().notNull(),
    notificationsEnabled: boolean('notifications_enabled')
      .default(true)
      .notNull(),
    ...timestamps,
  },
  (table) => [index('saved_search_user_id_idx').on(table.userId)],
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
