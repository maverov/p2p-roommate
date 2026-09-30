# Backend API Guide

This guide explains the backend in this project from zero. It assumes you are comfortable with basic JavaScript objects, but new to TypeScript, Next.js backends, Drizzle, or authentication.

## What "Backend" Means Here

There is no separate Java server. The backend lives inside the Next.js app.

Next.js has a folder named `app/api/`. Files in that folder are HTTP endpoints. When the browser calls `/api/listings`, Next.js runs backend TypeScript on the server, talks to PostgreSQL through Drizzle, and returns JSON.

```text
Browser or client code
        |
        v
HTTP request to /api/...
        |
        v
Next.js route handler in app/api/
        |
        v
Zod validation + Better Auth session check
        |
        v
Drizzle query against PostgreSQL
        |
        v
JSON response
```

## Important Files

```text
app/api/                         HTTP endpoints
lib/server/api.ts                Shared backend helpers
db/index.ts                      Drizzle database client
db/schema.ts                     Database tables
features/listings/schemas/       Listing validation schemas
features/listings/server/        Listing database functions
features/conversations/server/   Conversation and message database functions
features/profiles/server/        Public profile and saved profile functions
features/reviews/server/         Review functions
features/viewing-requests/server/ Viewing request functions
features/reports/server/         Report database functions
features/admin/server/           Moderation functions (reports, listings, bans)
features/account/server/         Personal data export
features/notifications/server/   Email templates and who gets which email
features/uploads/                Blob upload helper (browser) and upload cleanup (server)
lib/server/admin.ts              Admin guards for pages and API routes
lib/server/rate-limit.ts         Per-user rate limits for write routes
lib/server/email.ts              Sends email through Resend
lib/server/background.ts         Runs work after the response (runInBackground)
lib/auth.ts                      Better Auth config (verification, reset, deletion)
```

Files that import `server-only`, `db`, `auth`, or `serverEnv` must stay on the server. Do not import them into React client components.

## Response Shape

Successful responses use this shape:

```json
{
  "data": {}
}
```

Errors use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": []
  }
}
```

This makes frontend code predictable: check `response.ok`, then read either `data` or `error`.

Two routes answer with a different body: `GET /api/me/export` returns the JSON file itself, and `POST /api/uploads` returns what the Vercel Blob client expects.

## Rate Limits

Every non-admin write route (plus the data export) counts requests per signed-in user. The limits live in `RATE_LIMITS` in `lib/server/rate-limit.ts`:

```text
startConversation      10 per hour
sendMessage            30 per minute
createListing          10 per day
updateListing          60 per hour   (PATCH and DELETE)
requestViewing         10 per hour
updateViewingRequest   60 per hour
report                 10 per hour
review                 10 per hour
favorite              120 per minute (listings and profiles, save and unsave)
block                  30 per hour   (block and unblock)
updateProfile          30 per hour
upload                 60 per hour
dataExport              5 per hour
```

Past the limit the route returns `429`, with a `Retry-After` header in seconds:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again later.",
    "details": { "retryAfterSeconds": 1740 }
  }
}
```

The counters are fixed windows in the `api_rate_limit` table, so they hold across server instances. Better Auth limits `/api/auth/*` separately, per IP: 100 requests per minute (`rateLimit` in `lib/auth.ts`), with its built-in stricter rules for sign-in, sign-up, and password-reset requests. Its counters live in the `rate_limit` table, and Better Auth enables that limiter in production only.

## Authentication

Authentication is handled by Better Auth.

Public routes can be called by anyone. Protected routes require a signed-in user. The backend checks this with:

```ts
const user = await requireCurrentUser(request);
```

If there is no session cookie, the endpoint returns:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be signed in."
  }
}
```

Better Auth's own endpoints live under `/api/auth` (`lib/auth.ts`); the browser calls them through `lib/auth-client.ts`. The account rules:

- **Email verification is required.** Sign-up sends a verification link (valid 24 hours) and creates no session. Signing in before verifying returns `403 EMAIL_NOT_VERIFIED` and sends a fresh link. Opening the link signs the user in and lands on `/verify-email`.
- **Password reset.** `/forgot-password` requests a link (valid 1 hour) that opens `/reset-password`. Resetting the password signs the user out of every session.
- **Email language.** `user.locale` (`bg` or `en`) picks the language of every email. Sign-up stores the page's locale; `/settings` changes it through `updateUser`.
- **Google and Facebook.** `/login` and `/signup` show a "Continue with" button per provider whose `*_CLIENT_ID` and `*_CLIENT_SECRET` are both set (`lib/server/social-auth.ts`). A first sign-in creates the account, in the page's language (passed through the OAuth state). Google confirms the email, so it links to an existing account with that address; Facebook does not, so a matching address fails with `account_not_linked` and the person signs in with their password. A Facebook account that shares no email fails with `email_not_found`. Failures return to `/login?error=<code>&provider=<id>`. Provider photos are not imported: their hosts are not on the image allowlist.
- **Account deletion.** `/settings` calls Better Auth's `deleteUser` with the current password. An account without one (Google or Facebook only) is deleted on a session less than a day old; an older session gets `SESSION_EXPIRED` and the page asks the person to sign in with their provider again. The user's data goes with the account row (foreign keys cascade; a report that names the user keeps the report with the reference cleared), and their uploaded photos are then deleted from Blob storage.

When you call protected endpoints from the browser, cookies are sent automatically for same-site requests. If you call them manually with `fetch`, include credentials:

```ts
await fetch('/api/listings', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ "title": "..." })
});
```

## Money

Money is stored as integer cents, not floating-point numbers.

```text
420 EUR  -> 42000
999.99 EUR -> 99999
```

Use `monthlyRentCents` and `depositCents` in API requests.

Every price is in euro cents: Bulgaria adopted the euro on 2026-01-01. `currency` is
optional, defaults to `EUR`, and any other value is rejected. The single currency is what
keeps price filters and sorting correct, since they compare raw cents. It is defined once
in `lib/currency.ts` and enforced by the `listing_currency_eur` database check.

## Endpoints

### Get Current User

```http
GET /api/me
```

Returns the signed-in user or `null`. The user object also carries Better Auth fields such as `emailVerified`, `image`, `role`, and `locale` (email language).

Example response:

```json
{
  "data": {
    "user": {
      "id": "user_123",
      "name": "Alex",
      "email": "alex@example.com"
    }
  }
}
```

### Export My Data

```http
GET /api/me/export
```

Protected endpoint. Downloads everything stored about the signed-in user as a JSON file (`stay-bg-data-<date>.json`), for GDPR access and portability: account, profile, listings with images, saved listings and profiles, viewing requests, reviews written and received, reports filed, every message in the user's conversations, and session metadata. No password hash, session token, or verification secret is included. Rate-limited to 5 per hour. The response is the file itself, not a `{ "data": ... }` wrapper.

### Upload A Photo

```http
POST /api/uploads
```

Protected endpoint used by the Vercel Blob client (`features/uploads/upload-image.ts`), not called by hand. It only issues a short-lived client token; the browser then uploads the file straight to Blob storage and gets back a public URL to put in a listing's `images` or a profile's `avatarUrl`.

- The path must start with `listings/` or `avatars/` (`400 INVALID_UPLOAD_PATH` otherwise).
- JPEG, PNG, WebP, or AVIF, at most 10 MB (`IMAGE_UPLOAD` in `lib/images.ts`), enforced by the token.
- A random suffix is added to every file name.
- Returns `503 UPLOADS_NOT_CONFIGURED` when `BLOB_READ_WRITE_TOKEN` is not set.

### List Published Listings

```http
GET /api/listings
```

Public endpoint. Returns only `PUBLISHED` listings.

Query params:

```text
q                  search text
citySlug           example: sofia
neighborhoodSlug   comma-separated, example: lozenets,center (max 40)
propertyType       comma-separated: APARTMENT | HOUSE | STUDIO | ROOM
roommatePreference ANY | STUDENTS | PROFESSIONALS | WOMEN_ONLY | MEN_ONLY
minRentCents       example: 30000
maxRentCents       example: 80000
bedroomCount       minimum bedroom count
maxOccupants       minimum occupant capacity
availableFrom      ISO date
isVerified         true | false
isFurnished        true | false
internetIncluded   true | false
utilitiesIncluded  true | false
petsAllowed        true | false
nearMetro          true | false
roommateFriendly   true | false
sort               newest (default) | price-asc | price-desc
page               default: 1
perPage            default: 20, max: 50
```

Boolean filters also accept `1` and `0`.

Example:

```ts
const response = await fetch('/api/listings?citySlug=sofia&maxRentCents=80000');
const body = await response.json();

console.log(body.data.items);
```

### Get One Published Listing

```http
GET /api/listings/:id
```

Public endpoint. Returns one published listing.

Example:

```ts
const response = await fetch('/api/listings/listing_123');
const body = await response.json();
```

### Create Listing

```http
POST /api/listings
```

Protected endpoint. The signed-in user becomes the listing owner.

Minimal body:

```json
{
  "title": "Sunny room in Lozenets",
  "description": "Bright furnished room close to metro and grocery stores.",
  "status": "DRAFT",
  "propertyType": "ROOM",
  "roommatePreference": "ANY",
  "citySlug": "sofia",
  "neighborhoodSlug": "lozenets",
  "monthlyRentCents": 42000,
  "currency": "EUR",
  "bedroomCount": 1,
  "bathroomCount": 1,
  "maxOccupants": 1
}
```

Body with images:

```json
{
  "title": "Sunny room in Lozenets",
  "description": "Bright furnished room close to metro and grocery stores.",
  "status": "PUBLISHED",
  "propertyType": "ROOM",
  "citySlug": "sofia",
  "monthlyRentCents": 42000,
  "currency": "EUR",
  "bedroomCount": 1,
  "bathroomCount": 1,
  "maxOccupants": 1,
  "images": [
    {
      "url": "https://abc123.public.blob.vercel-storage.com/listings/room-Xy7Kq2.jpg",
      "alt": "Sunny furnished room",
      "sortOrder": 0
    }
  ]
}
```

Image URLs must be photos uploaded through `POST /api/uploads`: `isAllowedImageUrl` (`lib/images.ts`) accepts only https URLs on the Blob upload host (plus `picsum.photos` outside production, for seed data), so any other external URL fails validation. A listing takes at most 12 images, each with `alt` text (1–160 characters). The image with the lowest `sortOrder` (the array index when omitted) is the cover.

### Update Listing

```http
PATCH /api/listings/:id
```

Protected endpoint. Only the listing owner can update it.

Body can contain any subset of create listing fields:

```json
{
  "monthlyRentCents": 45000,
  "status": "PUBLISHED"
}
```

If you send `images`, the backend replaces the listing image list with the new list.

### Archive Listing

```http
DELETE /api/listings/:id
```

Protected endpoint. Only the owner can archive it.

This does not physically delete the row. It sets the listing status to `ARCHIVED`, which is safer for audit/history.

### Favorite Listing

```http
POST /api/listings/:id/favorite
DELETE /api/listings/:id/favorite
```

Protected endpoints.

`POST` saves a listing for the current user.

`DELETE` removes it from saved listings.

### Similar Listings

```http
GET /api/listings/:id/similar
```

Public endpoint. Returns listings in the same city and property type.

Query params:

```text
limit   default 6, max 20
```

### Listing Reviews

```http
GET /api/listings/:id/reviews
```

Public endpoint. Returns reviews for one listing plus a rating summary.

Query params:

```text
page     default 1
perPage  default 20, max 50
```

### Request A Viewing

```http
POST /api/listings/:id/viewing-requests
```

Protected endpoint. Creates a viewing request for a published listing.

Body:

```json
{
  "requestedStartAt": "2026-07-15T15:00:00.000Z",
  "message": "I can come after work."
}
```

The listing owner gets an email linking to the Viewing requests section of My Listings, where they can accept or decline it.

### Public Profile

```http
GET /api/profiles/:id
```

Public endpoint. Returns profile data needed by the profile page and listing host cards:

- display name
- avatar
- bio
- city/neighborhood
- verification flags (returned, but hidden in the UI while `VERIFICATION_BADGES` is off)
- active listing count
- review summary
- traits and roommate preferences

### Update Own Profile

```http
PATCH /api/profiles/:id
```

Protected endpoint. The signed-in user can only update their own profile.

Body example:

```json
{
  "displayName": "Maria P.",
  "bio": "I rent clean, quiet apartments in Lozenets.",
  "phoneNumber": "+359888123456",
  "citySlug": "sofia",
  "neighborhoodSlug": "lozenets",
  "publicContactAllowed": true,
  "traits": ["OWNER", "NON_SMOKER", "WORKS_FROM_OFFICE"],
  "languages": ["Bulgarian", "English"],
  "roommatePreferences": {
    "pets": true,
    "smoking": false,
    "quietHoursFrom": "23:00"
  }
}
```

Every field is optional, and omitted fields are left unchanged. `bio` (max 2000
characters), `phoneNumber`, `citySlug`, `neighborhoodSlug`, and `avatarUrl` also accept
`null`, which clears them. `avatarUrl` must be a photo uploaded through `POST /api/uploads`,
like listing images. The `/settings` page edits the profile through this endpoint.

`roommatePreferences` accepts only the fields in `roommatePreferencesSchema`
(`features/profiles/schemas/index.ts`): `gender`, `smoking`, `pets`, `quietHoursFrom`,
`budgetMinCents`, `budgetMaxCents`, `ageMin`, `ageMax`, `occupation`, `environment`.

### Profile Listings

```http
GET /api/profiles/:id/listings
```

Public endpoint. Returns active published listings for one profile.

### Profile Reviews

```http
GET /api/profiles/:id/reviews
```

Public endpoint. Returns reviews written about one user plus rating summary.

### Save Profile

```http
POST /api/profiles/:id/favorite
DELETE /api/profiles/:id/favorite
```

Protected endpoints. Saves or unsaves a public profile.

### Show Profile Phone

```http
GET /api/profiles/:id/phone
```

Protected endpoint. Returns the profile phone number only if contact is allowed, or if the viewer owns the profile.

### Saved Listings And Profiles

```http
GET /api/favorites
```

Protected endpoint. Returns both saved listings and saved profiles for the current user.

### Create Review

```http
POST /api/reviews
```

Protected endpoint. Creates a review for a listing or a user.

Listing review:

```json
{
  "targetType": "LISTING",
  "listingId": "listing_123",
  "rating": 5,
  "body": "The room matched the photos and the owner replied quickly."
}
```

User review:

```json
{
  "targetType": "USER",
  "targetUserId": "user_456",
  "rating": 5,
  "body": "Maria was responsive and clear."
}
```

Do not send `reviewerRole`; the server derives it. A listing review is always `TENANT`
and needs an accepted viewing request for that listing. A user review needs an accepted
viewing request between the two users, and takes its role from it (requester → `TENANT`,
owner → `OWNER`). Each reviewer gets one review per target,
and nobody can review themselves.

The UI is stricter than the API: it offers a review only once an accepted viewing's time
has passed (`isViewingCompleted` in `features/viewing-requests/constants.ts`). The tenant
reviews the listing and the owner from Applied Listings; the owner reviews the tenant from
My Listings. A prompt disappears once that review exists.

### Viewing Requests

```http
GET /api/viewing-requests
PATCH /api/viewing-requests/:id
```

Protected endpoints.

List query:

```text
role=requester   only requests I made
role=owner       only requests for my listings
role=all         both directions
```

Update body:

```json
{
  "status": "ACCEPTED"
}
```

`status` must be one of `ACCEPTED`, `DECLINED`, or `CANCELLED`. A new request starts as
`REQUESTED`, which cannot be set through this endpoint.

- Only the listing owner can accept or decline, and only while the request is `REQUESTED`.
- Only the requester can cancel, and only while it is `REQUESTED` or `ACCEPTED`.
- Any other move returns `409 INVALID_STATUS_TRANSITION`.

The other side is emailed: the requester when the owner accepts or declines, the owner when the requester cancels. The UI (Applied Listings) stops offering Cancel once an accepted viewing's time has passed; the API does not enforce that.

### List Conversations

```http
GET /api/conversations
```

Protected endpoint. Returns conversations where the current user is a participant.

### Start Conversation

```http
POST /api/conversations
```

Protected endpoint.

Body, either about a listing:

```json
{
  "listingId": "listing_123",
  "message": "Hi, is this room still available?"
}
```

or to someone with a "room wanted" post, optionally offering one of your own listings:

```json
{
  "recipientId": "user_456",
  "listingId": "your_listing_789",
  "message": "My room in Lozenets might suit you."
}
```

There is one thread per pair of people per listing (or per pair with no listing); an existing one is returned. You cannot message your own listing or yourself. Writing without a listing, or offering yours, needs the recipient's "room wanted" post (`403 RECIPIENT_NOT_LOOKING`). A block either way returns `403 USER_BLOCKED`.

### Block Or Unblock A User

```http
POST   /api/profiles/:id/block
DELETE /api/profiles/:id/block
GET    /api/me/blocks
```

Protected endpoints. Blocking is idempotent and the other person is not told. While either person has blocked the other, neither can start a conversation, send a message, request a viewing, or reveal the other's phone number (`403 USER_BLOCKED`). `GET /api/me/blocks` lists the people you blocked, newest first.

### List Messages

```http
GET /api/conversations/:id/messages
```

Protected endpoint. Only conversation participants can read messages.

This endpoint supports polling. Polling means the frontend asks the backend for new messages every few seconds. It is not realtime push like WebSockets, but it is simple and reliable.

Query params:

```text
after    optional ISO date cursor; returns messages created after this time
afterId  optional message id; requires `after`. Breaks ties between messages that share
         the `after` timestamp, so none are skipped
limit    optional number; default 50, max 100
```

Pass both cursors back on every poll. `nextCursor` and `nextCursorId` are `null` while the
conversation has no messages.

Initial load:

```ts
const response = await fetch('/api/conversations/conversation_123/messages', {
  credentials: 'include'
});

const body = await response.json();

const messages = body.data.items;
let cursor = { after: body.data.nextCursor, afterId: body.data.nextCursorId };
const pollAfterMs = body.data.pollAfterMs;
```

Polling for newer messages:

```ts
setInterval(async () => {
  const params = new URLSearchParams();

  if (cursor.after) params.set('after', cursor.after);
  if (cursor.afterId) params.set('afterId', cursor.afterId);

  const response = await fetch(
    `/api/conversations/conversation_123/messages?${params}`,
    { credentials: 'include' }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error.message);
  }

  cursor = { after: body.data.nextCursor, afterId: body.data.nextCursorId };
}, pollAfterMs);
```

Example response:

```json
{
  "data": {
    "items": [
      {
        "id": "message_123",
        "body": "Can I schedule a viewing tomorrow?",
        "senderId": "user_123",
        "senderName": "Alex",
        "createdAt": "2026-07-05T19:30:00.000Z"
      }
    ],
    "nextCursor": "2026-07-05T19:30:00.000Z",
    "nextCursorId": "message_123",
    "pollAfterMs": 3000
  }
}
```

### Send Message

```http
POST /api/conversations/:id/messages
```

Protected endpoint. Only conversation participants can send messages.

Body:

```json
{
  "body": "Can I schedule a viewing tomorrow?"
}
```

The other participants get an email, unless the same sender already wrote in that conversation in the previous 15 minutes, so a burst of messages sends one email. Starting a new conversation with a first `message` emails the owner the same way.

### Report Listing Or User

```http
POST /api/reports
```

Protected endpoint.

Body:

```json
{
  "listingId": "listing_123",
  "reportedUserId": "user_456",
  "reason": "SCAM",
  "details": "The photos look fake and the price is too low."
}
```

You must provide `listingId`, `reportedUserId`, or both.

`reason` is a code, not free text:

```text
SCAM | MISLEADING | UNAVAILABLE | HARASSMENT | FAKE_PROFILE | INAPPROPRIATE | OTHER
```

`details` is optional (max 2000 characters), except that `OTHER` requires it.

## Admin Endpoints

Admin-only. Any caller who is not signed in as an admin gets `404 NOT_FOUND`, the same
as an unknown URL, so the endpoints are not advertised. For the same reason they are left
out of `docs/openapi.json`. Grant the role with `pnpm admin:set-role <email> admin`.

### Decide A Report

```http
PATCH /api/admin/reports/:id
```

```json
{ "status": "RESOLVED", "note": "Listing archived; photos were stock images." }
```

`status` is `REVIEWING`, `RESOLVED`, or `DISMISSED`. `RESOLVED` and `DISMISSED` close
the report and require a `note` (1–1000 characters). Allowed moves:

```text
OPEN       -> REVIEWING | RESOLVED | DISMISSED
REVIEWING  -> RESOLVED | DISMISSED
RESOLVED, DISMISSED -> (final)
```

An invalid move returns `409 INVALID_STATUS_TRANSITION`. If another admin changed the
report first, the request returns `409 REPORT_CHANGED`.

### Archive A Listing

```http
PATCH /api/admin/listings/:id
```

```json
{ "status": "ARCHIVED" }
```

Archives any listing, whoever owns it: it leaves search and its public page, and the owner
can no longer edit it. `ARCHIVED` is the only accepted status.

### Ban A User

```http
POST /api/admin/users/:id/ban
```

```json
{ "reason": "Repeated scam listings.", "durationDays": 30 }
```

`durationDays` is `7`, `30`, or `null` for a permanent ban. The ban goes through the
Better Auth `admin` plugin, which signs the user out everywhere and blocks new sign-ins.
The user's published listings are then set to `PAUSED`, so they can be republished after
an unban. The response is `{ "data": { "pausedListingCount": 2 } }`.

Admins cannot be banned (`409 CANNOT_BAN_ADMIN`); revoke the role first.

## How To Query From Frontend Code

Use `fetch`. Always check `response.ok`.

```ts
async function loadListings() {
  const response = await fetch('/api/listings?citySlug=sofia');
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error.message);
  }

  return body.data.items;
}
```

For protected writes:

```ts
async function createListing() {
  const response = await fetch('/api/listings', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Sunny room in Lozenets',
      description: 'Bright furnished room close to metro and grocery stores.',
      propertyType: 'ROOM',
      citySlug: 'sofia',
      monthlyRentCents: 42000,
      currency: 'EUR',
      bedroomCount: 1,
      bathroomCount: 1,
      maxOccupants: 1
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error.message);
  }

  return body.data;
}
```

## How To Add A New Backend Endpoint

Use this checklist:

1. Add or reuse a Zod schema for the input.
2. Add a server repository function under `features/<feature>/server/`.
3. Add a route handler under `app/api/`.
4. Wrap the route in `handleApiRoute`.
5. Use `requireCurrentUser(request)` if the route is private.
6. If it writes, call `enforceRateLimit(bucket, user.id)` right after the auth check, with an existing or new bucket in `RATE_LIMITS`.
7. Send emails and other side effects with `runInBackground(...)` so they never delay or fail the response.
8. Return `apiOk(data)`, `apiCreated(data)`, or `apiNoContent()`.
9. Run `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build`.

Small route example:

```ts
import { apiOk, handleApiRoute, requireCurrentUser } from '@/lib/server/api';

export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const user = await requireCurrentUser(request);

    return apiOk({ userId: user.id });
  });
}
```

## Local Development

Start the app:

```powershell
pnpm dev
```

Check types:

```powershell
pnpm type-check
```

Build production output:

```powershell
pnpm build
```

The API routes use `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` from `.env.local` (copy `.env.example`). `RESEND_API_KEY` / `EMAIL_FROM` (email) and `BLOB_READ_WRITE_TOKEN` (uploads) are optional locally: without them, emails are printed to the dev server console and uploads return `503`. See [README.setup.md](README.setup.md).

## OpenAPI

[`openapi.json`](openapi.json) covers every non-admin route above plus the core Better Auth routes under `/api/auth` (the Better Auth `admin` plugin's routes are left out too). It is written by `scripts/generate-openapi.ts`, and that script's schemas are maintained by hand, so update it whenever a route or Zod schema changes, then run `pnpm openapi:generate`.
