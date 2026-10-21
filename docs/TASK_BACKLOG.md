# Project task backlog

Recorded: 3 October 2026. Checkboxes record completion; no implementation is authorized by this document alone.

## Product decisions and constraints

- The platform serves Bulgaria, with at least the ten major cities in scope. Do not treat Sofia-only positioning as a requirement.
- The user wants to remove the viewing feature because scheduling and tracking add unnecessary overhead. Messaging remains the way people arrange viewings.
- Do not change application code until the user asks for implementation.
- Review handling confirmed on 16 October 2026: reviews require a two-way message exchange. Existing reviews remain visible.

## Immediate work

- [x] **T01 — Remove the viewing feature.** Removed scheduling UI, Applied Listings, APIs, notifications, navigation, translations, seed fixtures and active documentation. Historical storage remains only for scoped account export and cascading account deletion.
- [x] **T02 — Replace review eligibility.** Both people must have sent messages in the same conversation. Listing reviews require a thread linked to that listing and its current owner. Listing and profile pages expose eligible review actions; self-reviews, blocks and duplicate reviews are rejected. Existing reviews remain visible.
- [ ] **T03 — Protect location data in public responses.** Public listing APIs currently return exact coordinates and the address field even though maps display approximate locations. Define public versus owner-visible data; enforce that distinction in server responses, including any other public serialization paths. Verify anonymous and signed-in non-owner responses do not expose restricted location data.
- [ ] **T04 — Fix the messaging polling cursor.** Sending a message advances the cursor to that outgoing message, potentially skipping an earlier incoming message received between polls. Reproduce and fix this ordering case; verify replies are neither skipped nor duplicated. The finding comes from code inspection, not a browser reproduction.
- [ ] **T05 — Correct homepage Roommate search.** The Roommate option currently searches roommate-friendly properties. Route it to roommate discovery and carry over applicable filters; explicitly account for property-only filters.
- [ ] **T06 — Hide banned users from public profile discovery.** Banning pauses listings, but public profile queries do not exclude banned users. Check directory, profile detail, and other relevant public discovery paths. Define behavior for temporary bans and expiry.

## Trust and launch content

- [ ] **T07 — Remove invented testimonials or replace them with authentic, permissioned feedback.** The homepage currently renders testimonials identified as invented in the launch checklist.
- [ ] **T08 — Complete privacy policy and terms.** Current pages are placeholder drafts. Confirm operator details, actual data practices, processors, retention, contact channels, and moderation rules with appropriate review. Reassess cookie requirements when analytics choices are made.
- [ ] **T09 — Verify production services and operations.** Confirm transactional email and verification delivery, photo uploads, database migrations, backup/restore arrangements, production URLs/secrets, and error monitoring. Verify configuration; do not assume checklist items are still outstanding.
- [ ] **T10 — Complete launch assets and contact channels.** Verify favicon, share image, brand assets, support/safety mailboxes, and operator information. Review founding-story copy for accuracy. Optional press and social sign-in content should not hold up the core work.

## Journey validation

- [ ] **T11 — Verify the complete marketplace journey with two accounts.** Publish a listing with photos, search and open it, contact its owner, exchange messages, save items, edit/pause the listing, and test blocking/banning. Include roommate profile creation/discovery/contact. Test mobile layouts and Bulgarian/English. Adjust review checks to the T02 decision; no viewing scheduling in the target journey.
- [ ] **T12 — Add targeted integration/end-to-end coverage for critical flows.** Existing 57 unit tests passed during the investigation, along with TypeScript, lint, and translation checks (eight unused-key warnings). No automated end-to-end journeys or database-backed business-flow tests were found. Prioritize authorization, public location privacy, messaging ordering, moderation, and the listing-to-contact journey. Production build and live services were not verified in that investigation.

## Marketplace measurement and freshness

- [ ] **T13 — Define and implement a minimal analytics funnel.** Track search/results, listing/profile views, listing/profile creation starts and completions, contact attempts, conversations started, and replies. Measure creation abandonment, response rate, time to first reply, and time to first enquiry. Define a useful enquiry rather than assuming every message is one. Break metrics down by city and listing type. Choose privacy-conscious collection and retention; avoid logging private message bodies or unnecessary personal data.
- [ ] **T14 — Capture successful outcomes.** Introduce a lightweight way to ask whether someone found a room/roommate or filled a listing. Distinguish self-reported outcomes from inferred activity; do not count conversations as successful matches. Any follow-up should fit the direct messaging flow without reintroducing viewing scheduling.
- [ ] **T15 — Establish listing and room-wanted freshness.** Define availability confirmation, reminders, stale-post handling, and an explicit filled/no-longer-looking outcome. Preserve the distinction between published inventory and genuinely available inventory.
- [ ] **T16 — Extend operational metrics.** Current admin statistics cover total users, published listings, bans, and open reports. Add actionable city-level measures for fresh supply, enquiry coverage, unanswered conversations, response times, confirmed outcomes, and retention as definitions/data become available.

## Later considerations

- [ ] **T17 — Review compatibility-score presentation.** The current percentage is a manually weighted preference heuristic, not a validated prediction of living compatibility. Consider explaining contributing factors and evaluating the score against real feedback before making stronger claims.
- [ ] **T18 — Make sharing convenient.** Search URLs are shareable, but explicit listing/profile sharing actions were not found in the investigation. Consider copy-link/native sharing when core reliability work is complete.

## Investigation references

- Homepage search: `components/home/HeroSearch.tsx`, property mapping and search destination.
- Public listing responses: `app/api/listings/route.ts`, `app/api/listings/[id]/route.ts`, `features/listings/server/repository.ts`, `lib/server/contact-visibility.ts`.
- Messaging cursor: `features/conversations/components/MessageThread.tsx`.
- Review eligibility: `features/reviews/server/repository.ts`.
- Public profile queries and bans: `features/profiles/server/repository.ts`, `features/admin/server/users.ts`.
- Testimonials and legal drafts: `components/home/Testimonials.tsx`, `locales/en/legal.json`, corresponding Bulgarian copy.
- Existing launch checklist: `LAUNCH_CHECKLIST.txt`. It contains dated claims; verify them against current state rather than copying its estimates or completion assumptions.

Update checkboxes only after implementation and relevant verification. Preserve unresolved decisions and evidence limits when updating this list.

## Validation — 16 October 2026

Scheduling removal and message-based reviews: 81 tests passed, including PostgreSQL integration tests using temporary tables. Translation integrity passed with eight pre-existing unused-key warnings. Migration 0015 adds the MEMBER review role without deleting records; applied locally. CI now runs the PostgreSQL regression tests after migrations.

Production build, TypeScript, lint, migration consistency and schema-drift checks passed. HTTP smoke checks verified Bulgarian/English pages, listing/profile details, 404s for removed scheduling pages/APIs, and rejection of unauthenticated review submissions.
