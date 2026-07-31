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

- authentication
- localized app structure
- public listing browsing
- listing details
- listing creation and editing
- search and filtering
- user profiles
- saved listings / favorites
- saved profiles
- reviews
- reports
- conversations / messaging
- viewing requests
- saved searches

This means the project is already beyond a very early MVP stage.

### 2. Direct renter to owner interaction

One of the main promises of the business plan is direct communication without brokers.

That is already reflected in the product through:
- conversations/messages
- owner contact flows
- viewing requests
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
- image support

### 4. Trust and moderation basics

The business plan depends heavily on trust.

The current app already includes important parts of that base:
- user accounts
- profile data
- reviews
- reporting flows
- protected user actions

So the trust layer has started, even if the full verification vision is not complete yet.

### 5. Multi-language support

The platform already supports a multilingual setup, which is a meaningful product milestone:

- locale-based routes
- typed translations
- Bulgarian and English support

## What looks partially achieved

### 1. Verification and trust system

The pitch materials strongly emphasize:
- ID verification
- phone verification
- verified owner status
- visible trust signals

The current product appears to have some of the groundwork, but not the full end-to-end verification system yet.

Status: **partially achieved**

### 2. Roommate-focused experience

The business plan is not only about apartments, but also about roommate discovery and compatibility.

The current app appears to support some roommate-related structure, but not a full matching engine.

Status: **partially achieved**

### 3. Messaging experience

Messaging exists, which is a big step.

However, the older roadmap also suggested a more real-time chat experience. The current project appears to have the product flow, but not necessarily the full real-time experience yet.

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

Saved searches exist, but the broader roadmap suggests:
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

An admin panel would support moderation, reporting review, verification workflows, and broader platform management.

This would be especially useful as the product grows and needs stronger internal tools.

Status: **still left to build**

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
- saved searches
- localization
- backend/API foundation

### Partially achieved

- verification and trust system
- roommate-oriented product direction
- premium trust signals
- messaging maturity
- moderation / fraud-prevention depth

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
- alerts and push notifications
- partner revenue integrations
- admin panel
- mobile / PWA expansion

## Bottom line

The project has already built a large part of the marketplace foundation.

What remains is mostly the layer that turns the platform into a stronger business and a stronger competitive product:
- monetization
- verification
- anti-agent protection
- admin tooling
- contracts
- advanced roommate intelligence
- deeper notifications and trust systems

In short:

- the **core platform is already meaningfully built**
- the **main business differentiation layer is still left to complete**
