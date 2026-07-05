import {
  boolean,
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
