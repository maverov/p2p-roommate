# Code Review Report: P2P Roommate (Stay.bg)

**Date**: July 30, 2026  
**Project**: p2p-roommate - Full-stack Next.js 14 roommate/rental discovery platform  
**Tech Stack**: Next.js 14, React 18, TypeScript, PostgreSQL, Drizzle ORM, Better Auth, Zod

---

## Executive Summary

The **p2p-roommate** codebase demonstrates **production-grade architecture** with excellent separation of concerns, strong type safety, and scalable design. The team has built a well-organized feature-based application with proper authentication, comprehensive validation, and centralized error handling.

**Overall Assessment**: ⭐⭐⭐⭐ (4/5)
- **Strengths**: Architecture, type safety, validation, error handling
- **Gaps**: Data integrity constraints, API consistency, authorization edge cases
- **Risk Level**: MEDIUM - addressable without architectural changes

---

## Project Strengths

### 1. ✅ Well-Organized Architecture
- **Feature-based modules**: Each domain (auth, listings, profiles, conversations, reviews, etc.) is self-contained
- **Clear separation**: API routes → repositories → schemas → types
- **Scalable pattern**: Easy to add new features following established conventions
- **Type safety**: End-to-end TypeScript with Drizzle ORM inference

### 2. ✅ Comprehensive Input Validation
- **Zod schemas**: All API inputs validated with constraints (string lengths, number ranges, arrays)
- **Cross-field validation**: Uses `.refine()` for complex validation rules
- **Consistent approach**: Same validation pattern across all endpoints
- **Type-safe coercion**: Proper handling of query parameters (coerce to number, date, boolean)

### 3. ✅ Solid Database Design
- **Relational schema**: Proper normalization with foreign keys and cascade behavior
- **Enum types**: Domain values (listing statuses, property types) properly constrained
- **Strategic indexing**: Key indexes on commonly filtered columns
- **Progressive migrations**: Clean migration history with 4 well-ordered steps

### 4. ✅ Strong Authentication & Authorization
- **Better Auth integration**: Clean abstraction for session management
- **Proper access control**: Multi-layer authorization (route → repository → query)
- **Ownership verification**: Explicit checks for listing owners, conversation participants, profile owners
- **Public/private separation**: Clear distinction between public and private endpoints

### 5. ✅ Centralized Error Handling
- **Unified error class**: `ApiError` with code, message, and optional details
- **Consistent responses**: All errors follow `{ error: { code, message, details } }` format
- **Proper status codes**: 400 (validation), 401 (auth), 403 (authorization), 404 (not found), 409 (conflict)
- **Detailed context**: Validation errors include all failing fields

---

## Critical Issues (Must Fix)

### 🔴 Issue #1: Missing Database Check Constraints

**Severity**: HIGH  
**Type**: Data Integrity  
**Impact**: Invalid data can be inserted via SQL bypassing application validation

#### Details

The database schema uses Zod validation at the application layer, but lacks corresponding CHECK constraints at the database level. This creates a vulnerability where invalid data could be inserted through:
- Direct SQL execution by privileged users
- Database migrations or admin tools
- Compromised application code

#### Specific Gaps

1. **Rating Field** (`db/schema.ts:343`)
   - Allows any integer value
   - Zod validates 1-5 in application
   - Risk: Ratings like 0, 6, -100 insertable via SQL
   ```sql
   -- Current: anything allowed
   INSERT INTO review (rating) VALUES (-50); -- Succeeds!
   ```

2. **Response Rate Field** (`db/schema.ts:154`)
   - No bounds checking
   - Risk: Values like -10, 150, 1000 possible
   - Used for filtering/sorting, so bad data impacts query results

3. **Monetary Fields** (`db/schema.ts:190-191`)
   - `monthlyRentCents` and `depositCents` allow negative values
   - Risk: Listings with -$100/month rent could exist
   - Financial records would be corrupted

#### Solution

Add migration `0004_add_check_constraints.sql`:

```sql
-- Add check constraints for rating
ALTER TABLE "review" ADD CONSTRAINT "review_rating_range" 
  CHECK ("rating" >= 1 AND "rating" <= 5);

-- Add check constraint for response rate (0-100%)
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_response_rate_range"
  CHECK ("response_rate" >= 0 AND "response_rate" <= 100);

-- Add check constraints for monetary fields
ALTER TABLE "listing" ADD CONSTRAINT "listing_monthly_rent_positive"
  CHECK ("monthly_rent_cents" > 0);

ALTER TABLE "listing" ADD CONSTRAINT "listing_deposit_nonnegative"
  CHECK ("deposit_cents" IS NULL OR "deposit_cents" >= 0);
```

**Timeline**: IMMEDIATE - before accepting more data

---

### 🔴 Issue #2: Authorization Gap in DELETE Operations

**Severity**: MEDIUM-HIGH  
**Type**: Silent Failures  
**Impact**: Hides bugs, race conditions unclear

#### Details

DELETE operations silently succeed even when targeting non-existent records. This creates ambiguity:
- User deletes favorite, success → doesn't know if it existed
- User deletes same favorite twice → both return 204 with no indication of second failure
- Difficult to debug race conditions or client bugs

#### Example

```typescript
// Current behavior in DELETE /favorites/{listingId}
const [result] = await db
  .delete(favorites)
  .where(and(
    eq(favorites.userId, userId),
    eq(favorites.listingId, listingId),
  ))
  .returning();

return apiNoContent(); // Success regardless of whether favorite existed!
```

#### Affected Endpoints

- `DELETE /favorites/{listingId}`
- `DELETE /saved-searches/{id}`  
- `DELETE /viewing-requests/{id}`
- `DELETE /profiles/{id}/favorite`

#### Solution Options

**Option A: Explicit error on missing resource** (Recommended)
```typescript
const [result] = await db.delete(favorites)...returning();

if (!result) {
  throw new ApiError(404, 'NOT_FOUND', 'Favorite not found.');
}
return apiNoContent();
```

**Option B: Document idempotent behavior** (Implicit success)
- Keep current behavior but update API docs
- Add comment explaining idempotent DELETE
- Ensure frontend handles gracefully

**Decision needed**: Which approach for your team?

**Timeline**: HIGH PRIORITY

---

### 🔴 Issue #3: Missing Composite Database Indexes

**Severity**: MEDIUM  
**Type**: Performance  
**Impact**: Query performance degrades with data growth

#### Details

Common query patterns lack composite indexes, requiring multiple index lookups (N-1 problem):

#### Missing Indexes

1. **Reviews by user** (`reviews(targetType, targetUserId)`)
   - Lookup: Get all user reviews
   - Current: Scans `review_target_user_id_idx` then filters by targetType
   - Impact: `O(n)` scan on user's full review table

2. **Reviews by listing** (`reviews(targetType, listingId)`)
   - Lookup: Get listing reviews for aggregation (average rating)
   - Current: Scans `review_listing_id_idx` then filters by targetType
   - Impact: Slow on listings with many reviews

3. **Listings by status and date** (`listings(status, publishedAt)`)
   - Lookup: "Get published listings, newest first"
   - Current: Scans `listing_city_status_idx`, then sorts manually
   - Impact: `O(n log n)` sort in memory for large result sets

4. **Viewing requests by listing and status** (`viewingRequests(listingId, status)`)
   - Lookup: "Get pending viewing requests for my listings"
   - Current: Scans `viewing_request_listing_id_idx`, filters in app
   - Impact: Fetches all requests even if only need status='REQUESTED'

#### Solution

Add to migration `0004`:

```sql
-- Reviews composite indexes
CREATE INDEX "review_target_user_composite_idx" 
  ON "review"("target_type", "target_user_id");

CREATE INDEX "review_target_listing_composite_idx" 
  ON "review"("target_type", "listing_id");

-- Listings composite index for status + date filtering
CREATE INDEX "listing_status_published_idx" 
  ON "listing"("status", "published_at" DESC);

-- Viewing requests for owner filtering
CREATE INDEX "viewing_request_listing_status_idx" 
  ON "viewing_request"("listing_id", "status");
```

**Timeline**: HIGH PRIORITY (before adding 10k+ records)

---

## High Priority Issues (Should Fix)

### 🟡 Issue #4: Account Table Missing Uniqueness

**Severity**: HIGH  
**File**: `db/schema.ts:51-74`  
**Type**: Data Integrity

**Problem**: No unique constraint on `(accountId, providerId)` combination

Multiple OAuth accounts for the same provider could exist:
```sql
-- Could have both:
INSERT INTO account(user_id, account_id, provider_id) VALUES ('user1', 'oauth-123', 'google');
INSERT INTO account(user_id, account_id, provider_id) VALUES ('user1', 'oauth-123', 'google');
-- Duplicate OAuth link for same user!
```

**Solution**:
```sql
ALTER TABLE "account" ADD CONSTRAINT "account_provider_unique"
  UNIQUE("account_id", "provider_id");
```

---

### 🟡 Issue #5: Inconsistent API Response Format

**Severity**: MEDIUM  
**Files**: Multiple API routes in `app/api/`  
**Type**: API Design

**Problem**: Different endpoints return different response shapes

```typescript
// GET /listings - list endpoint
{ data: { items: [...], page: 1, perPage: 50, total: 100 } }

// GET /conversations - different list format
{ data: { items: [...] } }

// GET /favorites - completely different
{ data: { listings: [...], profiles: [...] } }

// GET /reviews/[id] - single resource
{ data: { id: 'review-1', body: '...' } }
```

**Impact**: Client code must handle multiple shapes:
```typescript
// Client confusion
const response = await fetch('/api/listings');
const { data } = await response.json();
// Is data.items an array? Or is data an array? Or...?
```

**Solution**: Standardize pattern

Pick ONE approach:

**Option A: Consistent list endpoint**
```typescript
// ALL list endpoints
{ data: { items: [], page: 1, perPage: 50, total: 100 } }

// Single resource
{ data: { id: 'review-1' } }
```

**Option B: Nested resource structure**
```typescript
// Endpoints match their path structure
{ data: { reviews: [...] } }
{ data: { listings: [...], profiles: [...] } }
```

**Recommendation**: Option A (more consistent, easier to document)

---

### 🟡 Issue #6: Denormalized Metrics Not Synchronized

**Severity**: MEDIUM  
**File**: `db/schema.ts:154-155`  
**Type**: Data Consistency

**Problem**: `userProfiles.responseRate` and `successfulRentals` are manually maintained

These metrics become stale over time:
- No automatic update when reviews created/deleted
- Manual updates only → requires explicit code
- Data diverges from reality

**Example**: Response rate could be wrong if:
1. Cron job to update failed silently
2. Someone deletes a review via admin panel
3. Data cleanup removes orphaned reviews

**Solution**: Choose ONE approach

1. **Database triggers** (automatic):
   ```sql
   CREATE TRIGGER update_response_rate 
   AFTER INSERT ON review 
   BEGIN UPDATE user_profile SET response_rate = ... END;
   ```
   - Pros: Always accurate, automatic
   - Cons: More complex SQL, harder to debug

2. **Compute on-the-fly** (always current):
   ```typescript
   const profile = await db.select()
     .from(userProfiles)
     .leftJoin(reviews, eq(reviews.reviewerId, userProfiles.userId))
     .where(...);
     // Calculate response_rate from joined reviews
   ```
   - Pros: No stale data, simple
   - Cons: Slower queries (aggregate function on large table)

3. **Scheduled recalculation job** (background):
   ```typescript
   // Every night at 2 AM
   const profiles = await db.select().from(userProfiles);
   for (const profile of profiles) {
     const rate = await calculateResponseRate(profile.userId);
     await updateProfile(profile.userId, { responseRate: rate });
   }
   ```
   - Pros: Flexible, reasonable freshness
   - Cons: Potential lag, requires cron infrastructure

**Recommendation**: Start with **compute on-the-fly** until performance becomes issue, then optimize with triggers.

---

### 🟡 Issue #7: Message Content Length Inconsistency

**Severity**: MEDIUM  
**Files**: 
- `features/conversations/schemas/index.ts:22` (message min 1 char)
- `features/reviews/schemas/index.ts:8` (review body min 3 chars)

**Problem**: Different minimum lengths for similar content

```typescript
// Messages: Allow single character
export const createMessageInputSchema = z.object({
  body: z.string().trim().min(1).max(2000), // "x" allowed
});

// Reviews: Require 3+ characters  
export const createReviewInputSchema = z.object({
  body: z.string().trim().min(3).max(2000), // "xx" rejected
});
```

**Impact**: Poor UX - user can send empty/single-character messages

**Solution**: Standardize to 3 characters minimum

```typescript
export const createMessageInputSchema = z.object({
  body: z.string().trim().min(3).max(2000), // Consistent!
});
```

---

### 🟡 Issue #8: Database-Specific Error Code Coupling

**Severity**: MEDIUM  
**File**: `features/reviews/server/repository.ts:59`

**Problem**: PostgreSQL error code hardcoded

```typescript
function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes('23505'); // PG-specific!
}
```

This fails if database ever switches to MySQL/SQLite (different error codes).

**Solution**: Generic error wrapper

```typescript
async function createReview(...) {
  try {
    return await db.insert(reviews).values(...).returning();
  } catch (error) {
    // Let database-specific logic stay in Drizzle
    if (error instanceof DBError && error.constraint === 'unique') {
      throw new ApiError(409, 'ALREADY_REVIEWED', '...');
    }
    throw error;
  }
}
```

---

## Medium Priority Issues (Good to Fix)

### 🟠 Issue #9: Missing Logical Validation Constraints

**File**: `db/schema.ts`

Several fields accept illogical values:

1. **Bedroom/bathroom counts** (lines 193-194)
   - Zod validates 0-20
   - No DB constraint allows -5, -1, 1000
   - Solution: Add CHECK constraints

2. **Floor numbers** (lines 197-198)  
   - No validation that `floor <= totalFloors`
   - Currently: 5th floor in a 3-story building allowed
   - Solution: Add CHECK `(total_floors IS NULL OR total_floors > floor)`

3. **Viewing request times** (lines 313-315)
   - `requested_start_at` allows past dates
   - Could be intentional (historical viewings), but not documented
   - Solution: Add comment if intentional; add CHECK if should be future-only

---

### 🟠 Issue #10: Insufficient Structured Logging

**Severity**: MEDIUM  
**File**: `lib/server/api.ts:107`

**Problem**: Errors logged to console without context

```typescript
} catch (error) {
  console.error(error); // Just logs the error!
  
  return errorResponse(500, {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong.',
  });
}
```

**Missing context**:
- Which endpoint failed?
- Which user triggered it?
- What were the input parameters?
- When did it happen?

**Impact**: Difficult to debug production issues

**Solution**: Implement structured logging

```typescript
const logger = createLogger();

} catch (error) {
  logger.error('API_ERROR', {
    path: request.url,
    method: request.method,
    userId: currentUser?.id,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
  
  return errorResponse(500, {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong.',
    details: process.env.NODE_ENV === 'development' ? error : undefined,
  });
}
```

**Recommended library**: `pino` or `winston`

---

### 🟠 Issue #11: Cross-Field Validation Inconsistency

**File**: `features/conversations/schemas/index.ts` vs. others

**Problem**: Some schemas use `.refine()` for complex validation, others don't

**Good example** (messages):
```typescript
export const listMessagesQuerySchema = z
  .object({
    after: z.coerce.date().optional(),
    afterId: z.string().min(1).optional(),
  })
  .refine((query) => !query.afterId || query.after, {
    message: 'afterId requires after.',
    path: ['afterId'],
  });
```

**Missing in other schemas**: Viewing request filters, listings filters, etc.

**Solution**: Apply `.refine()` pattern where fields have dependencies

---

## Low Priority Issues (Nice to Have)

### 💡 Issue #12: Overly Permissive Image URL Pattern

**Severity**: LOW  
**File**: `next.config.js:12-19`

**Current**:
```javascript
remotePatterns: [{
  protocol: 'https',
  hostname: '**',  // Allows ANY domain
}]
```

**Risk**: Could load images from untrusted sources

**Better approach** (whitelist specific CDNs):
```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'cdn.example.com',  // Your CDN
  },
  {
    protocol: 'https',
    hostname: '*.cloudinary.com',  // If using Cloudinary
  },
]
```

---

### 💡 Issue #13: Documentation Gaps

**Type**: Knowledge Transfer

Consider adding:
- API authorization docs (which endpoints require which permissions)
- Database schema diagram (entities and relationships)
- Architecture decision records (why certain patterns chosen)
- Soft delete strategy (are soft deletes needed for compliance?)
- Audit logging requirements (GDPR, compliance)

---

## Performance Observations

### ✅ Good Patterns
- Proper pagination with limits
- Eager loading of related data (joining user info with listings)
- Cursor-based pagination for messages (efficient for real-time)

### Improvement Opportunities  
1. **N+1 queries**: Some repository functions could batch load related data
2. **Missing cached fields**: Consider caching listing image URLs
3. **Slow list endpoints**: Would benefit from denormalization or caching

---

## Security Assessment

### ✅ Strengths
- **SQL Injection**: Not vulnerable (Drizzle ORM + parameterized queries)
- **Authentication**: Proper session management via Better Auth
- **Authorization**: Multi-layer checks (route → repo → query)
- **Validation**: Comprehensive input validation with Zod
- **CORS**: (Not reviewed - check middleware.ts)

### ⚠️ Gaps
- Missing database-level constraints (allow invalid data via SQL)
- Silent DELETE operations (hides errors)
- Overly permissive image URLs (trust all HTTPS domains)

### Recommendations
- Implement database constraints immediately
- Add structured logging for audit trails
- Document security assumptions (e.g., admin SQL access trusted?)

---

## Code Quality Metrics

| Category | Rating | Notes |
|----------|--------|-------|
| Type Safety | ⭐⭐⭐⭐⭐ | Excellent end-to-end TypeScript |
| Error Handling | ⭐⭐⭐⭐ | Centralized, but logging is minimal |
| Validation | ⭐⭐⭐⭐⭐ | Comprehensive Zod schemas |
| Authorization | ⭐⭐⭐⭐ | Good patterns, minor gaps |
| API Design | ⭐⭐⭐ | Inconsistent response formats |
| Database Design | ⭐⭐⭐⭐ | Solid schema, missing constraints |
| Performance | ⭐⭐⭐ | Good base, missing some indexes |
| Documentation | ⭐⭐⭐ | Decent structure, gaps in decisions |

---

## Implementation Roadmap

### Phase 1: Critical Fixes (This Sprint)
- [ ] Add migration 0004 with CHECK constraints (rating, response_rate, monetary fields)
- [ ] Add missing composite indexes
- [ ] Add unique constraint to account table

### Phase 2: High-Impact Improvements (Next Sprint)
- [ ] Standardize API response format
- [ ] Fix DELETE operations (decide on error vs. idempotent)
- [ ] Implement structured logging

### Phase 3: Code Quality (Following Sprint)
- [ ] Add logical validation constraints  
- [ ] Increase minimum message length to 3 chars
- [ ] Document authorization per endpoint
- [ ] Address denormalized metrics sync

### Phase 4: Polish (Backlog)
- [ ] Add soft delete pattern (if needed)
- [ ] Performance optimization (caching, batching)
- [ ] Audit logging for compliance
- [ ] Image URL whitelisting

---

## Conclusion

The p2p-roommate project is **well-architected and production-ready**, with strong foundations in type safety, validation, and separation of concerns. The identified issues are **not architectural flaws** but rather **missing guardrails** and **consistency gaps** that can be addressed without major refactoring.

**Recommended next steps**:
1. Schedule planning session to address critical issues
2. Prioritize database constraints (blocking data integrity)
3. Standardize API format (high team velocity impact)
4. Implement structured logging (operational visibility)

**Overall**: Great foundation to build on. Address the critical issues and you'll have an even more robust system.

---

## Appendix: Checked Files

- ✅ db/schema.ts (full)
- ✅ db/migrations/ (all migrations)
- ✅ app/api/* (22 routes reviewed)
- ✅ features/*/schemas/ (all validation schemas)
- ✅ features/*/server/repository.ts (data access layer)
- ✅ lib/server/api.ts (error handling utilities)
- ✅ package.json (dependencies)
- ✅ next.config.js (configuration)
- ✅ tsconfig.json (TypeScript config)

