# Business plan summary and product progress

This document summarizes the older pitch/business-plan materials and compares them with what is already present in the current codebase.

## What the business plan is trying to build

stay.bg is meant to be a peer-to-peer rental marketplace for Bulgaria.

Main idea:
- no agents
- no middleman commissions
- direct contact between renters and landlords
- better trust through profiles, reviews, messaging, and verification

Main problem it wants to solve:
- agent fees are expensive
- listings are often low quality, fake, or duplicated
- renters and owners do not have a simple direct channel
- roommate finding is fragmented

Main users:
- students
- young professionals
- expats and digital nomads
- private landlords
- homeowners renting out a room or property

Main business model:
- free marketplace at the core
- paid featured listings
- paid landlord tools / premium plans
- paid verification and trust features
- later partner revenue such as contracts, checks, insurance, and related services

## Important note about the technical plan

The older pitch materials described older technical directions such as Vite, Express, MongoDB, Socket.io, NestJS, or Prisma.

That is **not** the current implementation path.

The current app is built around:
- Next.js 14
- React 18
- TypeScript
- PostgreSQL
- Drizzle ORM
- Better Auth
- TanStack Query
- next-intl

So the **business vision stayed mostly the same**, but the technical implementation changed over time.

## What has already been achieved

### 1. Core marketplace foundation

The current project already has a strong base for the marketplace:

- authentication with required email verification and password reset
- localized app structure
- public listing browsing
- listing details
- listing creation and editing, with photo uploads
- search and filtering
- user profiles, edited from a settings page
- saved listings / favorites
- saved profiles
- reviews
- reports
- conversations / messaging
- viewing requests
- email notifications

This means the project is already beyond a very early MVP stage.

### 2. Direct renter to owner interaction

One of the main promises of the business plan is direct communication without brokers.

That is already reflected in the product through:
- conversations/messages
- owner contact flows
- viewing requests, which owners accept or decline from My Listings
- email notifications for new messages and viewing-request updates
- saved/favorite actions
- profile-based interactions

### 3. Listings system

The listings side of the product is already clearly established:

- structured listing data
- property and room support
- pricing fields
- location data
- listing filters
- listing validation
- photo uploads (up to 12 per listing, each with alt text; the first is the cover)
- a single currency (EUR)

### 4. Trust and moderation basics

The business plan depends heavily on trust.

The current app already includes important parts of that base:
- user accounts with a verified email address
- profile data
- reviews (gated on an accepted viewing request, and offered once the viewing has taken place)
- reporting flows with structured reasons
- an admin panel (`/admin`) for triaging reports, archiving listings, and banning users
- protected user actions, with per-user rate limits on messaging, listings, viewing requests, reviews, reports, and uploads

So the trust layer has started, even if the full verification vision is not complete yet.

### 5. Multi-language support

The platform already supports a multilingual setup, which is a meaningful product milestone:

- locale-based routes
- typed translations
- Bulgarian and English support
- emails in each user's chosen language

### 6. Privacy and account controls

- a settings page for the profile, roommate preferences, and email language
- a download of all of the user's data (JSON)
- self-service account deletion, which also removes the user's uploaded photos
- privacy and terms pages with the agreed section structure (the text is still a placeholder awaiting legal review)

## What looks partially achieved

### 1. Verification and trust system

The pitch materials strongly emphasize:
- ID verification
- phone verification
- verified owner status
- visible trust signals

The current product verifies every email address before an account can sign in. Profiles store verification flags, but nothing sets them for real accounts yet, so the badges are hidden (`VERIFICATION_BADGES` in `lib/feature-flags.ts`) until a phone or ID verification workflow exists.

Status: **partially achieved**

### 2. Roommate-focused experience

The business plan is not only about apartments, but also about roommate discovery and compatibility.

The current app appears to support some roommate-related structure, but not a full matching engine.

Status: **partially achieved**

### 3. Messaging experience

Messaging exists, which is a big step.

However, the older roadmap also suggested a more real-time chat experience. The current project has the product flow (new messages arrive by polling, and the recipient gets an email), but not a real-time experience yet.

Status: **partially achieved**

### 4. Trust signals and premium badges

The pitch mentions verified badges and stronger reputation signals.

Some of the product foundations are there, but the complete premium trust layer does not appear finished yet.

Status: **partially achieved**

## What is still left to build

### 1. Digital rental agreements

This is a major pitch feature, but there is no clear sign yet of:
- agreement generation
- contract workflows
- digital signing

Status: **not clearly built yet**

### 2. Monetization system

The business plan includes:
- featured listings
- landlord pro / premium tools
- tenant premium subscription
- paid verification

These revenue features do not appear to be fully implemented yet.

Status: **mostly still left to build**

### 3. Advanced roommate matching

The long-term vision includes:
- compatibility scoring
- lifestyle matching
- better roommate suggestions

The current app seems to have some building blocks, but not the full product feature.

Status: **still left to build**

### 4. Anti-agent / anti-fraud system

This is one of the strongest differentiators in the pitch.

The app has moderation basics, but there is no clear evidence yet of a deeper anti-agent or fraud-detection system.

Status: **still left to build**

### 5. Full verification workflow

Still likely incomplete:
- phone verification
- ID verification review flow
- stronger owner trust levels
- visible verification ladder

Status: **still left to build**

### 6. Advanced notifications and alerts

Transactional emails exist (email verification, password reset, new messages, viewing-request updates), but the broader roadmap suggests:
- proactive alerts
- push-style notifications
- stronger re-engagement flows

Status: **still left to build**

### 7. Partner and secondary revenue integrations

These future-stage items are not clearly present yet:
- background checks
- insurance
- utility setup partnerships
- moving/referral partnerships

Status: **still left to build**

### 8. Mobile / PWA expansion

Older roadmap ideas included broader platform expansion.

There is no clear evidence yet of:
- a native mobile app
- a completed PWA-focused rollout

Status: **still left to build**

### 9. Admin panel

A first admin panel exists at `/admin`: a dashboard, a report queue with resolve/dismiss
decisions, listing archiving, and timed or permanent user bans (Better Auth `admin`
plugin).

Still missing: verification review workflows, user search and management beyond bans,
a general audit log (report decisions already record who resolved them and why), and
broader platform management.

Status: **partially achieved**

## Simple progress view

### Achieved now

- core web platform
- auth foundation
- listings CRUD
- listing search/filtering
- listing details
- user profiles
- saved listings
- saved profiles
- reviews
- reports
- messaging
- viewing requests
- email verification and password reset
- email notifications
- photo uploads
- account settings, data download, and account deletion
- localization
- backend/API foundation

### Partially achieved

- verification and trust system
- roommate-oriented product direction
- premium trust signals
- messaging maturity
- moderation / fraud-prevention depth
- admin panel (report moderation, listing archiving, and bans are built; verification review and a general audit log are not)
- legal pages (privacy and terms have their structure; the final text awaits legal review)

### Still left to build

- digital rental agreements
- digital signing
- featured listing monetization
- landlord premium tools
- renter premium subscription
- paid verification
- advanced roommate matching
- anti-agent detection
- full identity and phone verification
- proactive alerts and push notifications
- partner revenue integrations
- mobile / PWA expansion

## Bottom line

The project has already built a large part of the marketplace foundation.

What remains is mostly the layer that turns the platform into a stronger business and a stronger competitive product:
- monetization
- verification
- anti-agent protection
- deeper admin tooling (verification review, a general audit log)
- contracts
- advanced roommate intelligence
- deeper notifications and trust systems

In short:

- the **core platform is already meaningfully built**
- the **main business differentiation layer is still left to complete**
