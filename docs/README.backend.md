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
features/saved-searches/server/  Saved search functions
features/viewing-requests/server/ Viewing request functions
features/reports/server/         Report database functions
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

## Endpoints

### Get Current User

```http
GET /api/me
```

Returns the signed-in user or `null`.

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

### List Published Listings

```http
GET /api/listings
```

Public endpoint. Returns only `PUBLISHED` listings.

Query params:

```text
q                  search text
citySlug           example: sofia
neighborhoodSlug   example: lozenets
propertyType       APARTMENT | HOUSE | STUDIO | ROOM
roommatePreference ANY | STUDENTS | PROFESSIONALS | WOMEN_ONLY | MEN_ONLY
minRentCents       example: 30000
maxRentCents       example: 80000
bedroomCount       minimum bedroom count
maxOccupants       minimum occupant capacity
page               default: 1
perPage            default: 20, max: 50
```

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
      "url": "https://example.com/room.jpg",
      "alt": "Sunny furnished room",
      "sortOrder": 0
    }
  ]
}
```

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

The listing owner can later accept or decline it.

### Public Profile

```http
GET /api/profiles/:id
```

Public endpoint. Returns profile data needed by the profile page and listing host cards:

- display name
- avatar
- bio
- city/neighborhood
- verification flags
- response time and response rate
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
    "pets": "allowed",
    "quietAfter": "23:00"
  }
}
```

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

### Saved Searches

```http
GET /api/saved-searches
POST /api/saved-searches
PATCH /api/saved-searches/:id
DELETE /api/saved-searches/:id
```

Protected endpoints. A saved search stores a name, filters, and whether notifications are enabled.

Create body:

```json
{
  "name": "Sofia rooms under 700 lv",
  "filters": {
    "citySlug": "sofia",
    "propertyType": "ROOM",
    "maxRentCents": 70000,
    "isVerified": true
  },
  "notificationsEnabled": true
}
```

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
  "reviewerRole": "TENANT",
  "rating": 5,
  "body": "The room matched the photos and the owner replied quickly."
}
```

User review:

```json
{
  "targetType": "USER",
  "targetUserId": "user_456",
  "reviewerRole": "TENANT",
  "rating": 5,
  "body": "Maria was responsive and clear."
}
```

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

Allowed statuses:

```text
REQUESTED
ACCEPTED
DECLINED
CANCELLED
```

Only the requester can cancel. Only the listing owner can accept or decline.

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

Body:

```json
{
  "listingId": "listing_123",
  "message": "Hi, is this room still available?"
}
```

The backend adds two participants:

- the signed-in user
- the listing owner

You cannot start a conversation with your own listing.

### List Messages

```http
GET /api/conversations/:id/messages
```

Protected endpoint. Only conversation participants can read messages.

This endpoint supports polling. Polling means the frontend asks the backend for new messages every few seconds. It is not realtime push like WebSockets, but it is simple and reliable.

Query params:

```text
after   optional ISO date cursor; returns messages created after this time
limit   optional number; default 50, max 100
```

Initial load:

```ts
const response = await fetch('/api/conversations/conversation_123/messages', {
  credentials: 'include'
});

const body = await response.json();

const messages = body.data.items;
const nextCursor = body.data.nextCursor;
const pollAfterMs = body.data.pollAfterMs;
```

Polling for newer messages:

```ts
let cursor = nextCursor;

setInterval(async () => {
  const response = await fetch(
    `/api/conversations/conversation_123/messages?after=${encodeURIComponent(cursor)}`,
    { credentials: 'include' }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error.message);
  }

  if (body.data.items.length > 0) {
    cursor = body.data.nextCursor;
  }
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
  "reason": "Suspicious listing",
  "details": "The photos look fake and the price is too low."
}
```

You must provide `listingId`, `reportedUserId`, or both.

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
6. Return `apiOk(data)`, `apiCreated(data)`, or `apiNoContent()`.
7. Run `pnpm type-check`, `pnpm lint`, and `pnpm build`.

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

The API routes use `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` from `.env.local`.
