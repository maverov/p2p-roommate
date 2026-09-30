import { parseListingHousehold, type ListingHousehold } from '@/features/listings/schemas';
import {
  parseProfileTraits,
  parseRoommatePreferences,
  type RoommatePreferences,
} from '@/features/profiles/schemas';
import type { ProfileTrait } from '@/lib/labels';

/**
 * How well a listing or another person fits the viewer, as a percentage, from data people
 * already fill in: lifestyle tags, roommate preferences, the "room wanted" post, and a
 * listing's household and rules.
 *
 * Each factor compares one thing both sides have stated and scores it 0–1; a factor either
 * side left blank is skipped rather than guessed, since a missing tag says nothing (no
 * `NON_SMOKER` tag does not make someone a smoker). The result is the weighted mean of the
 * factors that could be compared, pulled toward 50% (`PRIOR`) so that sparse agreement is
 * not a "100% match", and there is no score at all below `MIN_EVIDENCE`.
 */

export type CompatibilityProfile = {
  traits: readonly ProfileTrait[];
  preferences: RoommatePreferences;
  citySlug: string | null;
  /**
   * The "room wanted" fields (budget, wanted areas, dates) only count while the post is
   * published. The budget is stored in `preferences` but belongs to the post.
   */
  lookingForRoom: boolean;
  /** `YYYY-MM-DD`. */
  moveInDate: string | null;
  stayMonths: number | null;
  wantedNeighborhoods: readonly string[];
};

export type CompatibilityListing = {
  citySlug: string;
  neighborhoodSlug: string | null;
  monthlyRentCents: number;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  minStayMonths: number | null;
  maxStayMonths: number | null;
  availableFrom: Date | null;
  /** The stored `jsonb`; parsed here like every other read of it. */
  household: unknown;
};

/** A stored `user_profile` row, with its `jsonb` columns still unparsed. */
export type CompatibilityProfileRow = {
  traits: unknown;
  roommatePreferences: unknown;
  citySlug: string | null;
  lookingForRoom: boolean;
  moveInDate: string | null;
  stayMonths: number | null;
  wantedNeighborhoods: unknown;
};

export function toCompatibilityProfile(row: CompatibilityProfileRow): CompatibilityProfile {
  return {
    traits: parseProfileTraits(row.traits),
    preferences: parseRoommatePreferences(row.roommatePreferences),
    citySlug: row.citySlug,
    lookingForRoom: row.lookingForRoom,
    moveInDate: row.moveInDate,
    stayMonths: row.stayMonths,
    wantedNeighborhoods: Array.isArray(row.wantedNeighborhoods)
      ? row.wantedNeighborhoods.filter((slug): slug is string => typeof slug === 'string')
      : [],
  };
}

/** Relative importance: deal-breakers (money, place, pets, smoking, gender) count most. */
const WEIGHTS = {
  budget: 3,
  area: 2,
  pets: 2,
  smoking: 2,
  gender: 2,
  schedule: 2,
  social: 1.5,
  tidiness: 1.5,
  occupation: 1,
  age: 1,
  stay: 1,
  moveIn: 1,
} as const;

/** The least total weight worth a percentage: e.g. budget plus one more factor. */
export const MIN_EVIDENCE = 4;

/**
 * Imaginary evidence of an even 50% added to every score, so a few agreeing fields read as
 * a good match rather than a perfect one, and each further agreement moves the score up.
 */
const PRIOR = { weight: 2, score: 0.5 } as const;

/** Rent this far over the budget (as a share of it) scores zero. */
const BUDGET_TOLERANCE = 0.25;
/** A room free this many days after the seeker's move-in date still fits fully. */
const MOVE_IN_GRACE_DAYS = 14;
/** Two seekers moving within this many days of each other fit fully. */
const MOVE_IN_TOGETHER_DAYS = 30;
/** Past the grace period, the score falls to zero over this many days. */
const MOVE_IN_FALLOFF_DAYS = 60;
/** Age ranges this many years apart score zero. */
const AGE_FALLOFF_YEARS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

type Factor = { weight: number; score: number } | null;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function factor(weight: number, score: number | null): Factor {
  return score === null ? null : { weight, score: clamp01(score) };
}

/** The strictest of several independent signals about one factor, or null if none apply. */
function worst(...signals: Array<number | null | false>): number | null {
  const known = signals.filter((signal): signal is number => typeof signal === 'number');

  return known.length ? Math.min(...known) : null;
}

function mean(...signals: Array<number | null | false>): number | null {
  const known = signals.filter((signal): signal is number => typeof signal === 'number');

  return known.length ? known.reduce((sum, signal) => sum + signal, 0) / known.length : null;
}

function combine(factors: Factor[]): number | null {
  let weight = 0;
  let total = 0;

  for (const item of factors) {
    if (!item) continue;
    weight += item.weight;
    total += item.weight * item.score;
  }

  if (weight < MIN_EVIDENCE) return null;

  return Math.round(((total + PRIOR.weight * PRIOR.score) / (weight + PRIOR.weight)) * 100);
}

const has = (profile: CompatibilityProfile, trait: ProfileTrait) => profile.traits.includes(trait);

function calendarDay(value: string) {
  return Date.parse(`${value}T00:00:00Z`);
}

/** 1 when two ranges overlap, falling to 0 as the gap between them reaches `falloff`. */
function rangeFit(
  a: { min?: number; max?: number },
  b: { min?: number; max?: number },
  falloff: number,
) {
  const gap = Math.max(
    (a.min ?? -Infinity) - (b.max ?? Infinity),
    (b.min ?? -Infinity) - (a.max ?? Infinity),
    0,
  );

  return 1 - gap / falloff;
}

// --- Viewer and listing ---------------------------------------------------------------

function listingBudget(seeker: CompatibilityProfile, rentCents: number) {
  const max = seeker.preferences.budgetMaxCents;

  if (!seeker.lookingForRoom || max === undefined) return null;
  if (rentCents <= max) return 1;

  return 1 - (rentCents - max) / Math.max(max, 1) / BUDGET_TOLERANCE;
}

function listingArea(seeker: CompatibilityProfile, listing: CompatibilityListing) {
  if (!seeker.citySlug) return null;
  if (seeker.citySlug !== listing.citySlug) return 0;

  const wanted = seeker.lookingForRoom ? seeker.wantedNeighborhoods : [];

  return wanted.length === 0 ||
    (listing.neighborhoodSlug !== null && wanted.includes(listing.neighborhoodSlug))
    ? 1
    : 0.5;
}

function listingMoveIn(seeker: CompatibilityProfile, availableFrom: Date | null) {
  if (!seeker.lookingForRoom || !seeker.moveInDate) return null;
  // No date means the room is free now.
  if (!availableFrom) return 1;

  const lateDays = (availableFrom.getTime() - calendarDay(seeker.moveInDate)) / DAY_MS;

  return 1 - Math.max(lateDays - MOVE_IN_GRACE_DAYS, 0) / MOVE_IN_FALLOFF_DAYS;
}

function listingStay(seeker: CompatibilityProfile, listing: CompatibilityListing) {
  if (!seeker.lookingForRoom || seeker.stayMonths === null) return null;
  if (listing.minStayMonths === null && listing.maxStayMonths === null) return null;

  const fits =
    (listing.minStayMonths === null || seeker.stayMonths >= listing.minStayMonths) &&
    (listing.maxStayMonths === null || seeker.stayMonths <= listing.maxStayMonths);

  return fits ? 1 : 0.2;
}

function listingPets(
  seeker: CompatibilityProfile,
  listing: CompatibilityListing,
  home: ListingHousehold,
) {
  return worst(
    has(seeker, 'HAS_PET') && (listing.petsAllowed ? 1 : 0),
    seeker.preferences.pets === false && home.pets !== undefined && (home.pets ? 0 : 1),
    has(seeker, 'PET_FRIENDLY') && home.pets === true && 1,
  );
}

function listingSmoking(
  seeker: CompatibilityProfile,
  listing: CompatibilityListing,
  home: ListingHousehold,
) {
  return worst(
    seeker.preferences.smoking === false && home.smokers !== undefined && (home.smokers ? 0 : 1),
    has(seeker, 'NON_SMOKER') && (listing.smokingAllowed ? 0.5 : 1),
  );
}

function listingGender(seeker: CompatibilityProfile, home: ListingHousehold) {
  const wanted = seeker.preferences.gender;

  if (!home.genders || home.size === 0 || !wanted || wanted === 'ANY') return null;
  if (home.genders === 'MIXED') return 0.25;

  return (wanted === 'WOMEN_ONLY') === (home.genders === 'FEMALE') ? 1 : 0;
}

function listingAge(seeker: CompatibilityProfile, home: ListingHousehold) {
  const { ageMax, ageMin } = seeker.preferences;

  if ((ageMin === undefined && ageMax === undefined) || home.size === 0) return null;
  if (home.ageMin === undefined && home.ageMax === undefined) return null;

  return rangeFit(
    { min: ageMin, max: ageMax },
    { min: home.ageMin, max: home.ageMax },
    AGE_FALLOFF_YEARS,
  );
}

const SOCIAL_FIT = {
  QUIET: { QUIET: 1, BALANCED: 0.7, SOCIAL: 0.2 },
  SOCIAL: { QUIET: 0.3, BALANCED: 0.8, SOCIAL: 1 },
} as const;

function listingSocial(seeker: CompatibilityProfile, home: ListingHousehold) {
  const level = home.social;

  if (!level) return null;

  return mean(
    has(seeker, 'QUIET') && SOCIAL_FIT.QUIET[level],
    has(seeker, 'SOCIAL') && SOCIAL_FIT.SOCIAL[level],
  );
}

function listingTidiness(seeker: CompatibilityProfile, home: ListingHousehold) {
  if (!home.cleanliness || !has(seeker, 'TIDY')) return null;

  return home.cleanliness === 'RELAXED' ? 0.3 : 1;
}

function listingOccupation(seeker: CompatibilityProfile, home: ListingHousehold) {
  const occupation = home.occupation;

  if (!occupation) return null;

  const fit = (own: 'STUDENTS' | 'PROFESSIONALS') =>
    occupation === own ? 1 : occupation === 'MIXED' ? 0.75 : 0.4;

  return mean(
    has(seeker, 'STUDENT') && fit('STUDENTS'),
    has(seeker, 'PROFESSIONAL') && fit('PROFESSIONALS'),
  );
}

/** The viewer's fit with a listing, 0–100, or null when too little is known to say. */
export function scoreListing(
  seeker: CompatibilityProfile,
  listing: CompatibilityListing,
): number | null {
  const home = parseListingHousehold(listing.household);

  return combine([
    factor(WEIGHTS.budget, listingBudget(seeker, listing.monthlyRentCents)),
    factor(WEIGHTS.area, listingArea(seeker, listing)),
    factor(WEIGHTS.moveIn, listingMoveIn(seeker, listing.availableFrom)),
    factor(WEIGHTS.stay, listingStay(seeker, listing)),
    factor(WEIGHTS.pets, listingPets(seeker, listing, home)),
    factor(WEIGHTS.smoking, listingSmoking(seeker, listing, home)),
    factor(WEIGHTS.gender, listingGender(seeker, home)),
    factor(WEIGHTS.age, listingAge(seeker, home)),
    factor(WEIGHTS.social, listingSocial(seeker, home)),
    factor(WEIGHTS.tidiness, listingTidiness(seeker, home)),
    factor(WEIGHTS.occupation, listingOccupation(seeker, home)),
  ]);
}

// --- Two people -----------------------------------------------------------------------

/** Scores a pair of opposed tags: 1 when both lean the same way, `clash` when they differ. */
function sameLean(
  a: CompatibilityProfile,
  b: CompatibilityProfile,
  [left, right]: readonly [ProfileTrait, ProfileTrait],
  clash: number,
) {
  const lean = (profile: CompatibilityProfile) =>
    has(profile, left) === has(profile, right) ? null : has(profile, left) ? left : right;
  const leanA = lean(a);
  const leanB = lean(b);

  if (!leanA || !leanB) return null;

  return leanA === leanB ? 1 : clash;
}

function peopleBudget(a: CompatibilityProfile, b: CompatibilityProfile) {
  const maxA = a.preferences.budgetMaxCents;
  const maxB = b.preferences.budgetMaxCents;

  if (!a.lookingForRoom || !b.lookingForRoom || maxA === undefined || maxB === undefined) {
    return null;
  }

  return rangeFit(
    { min: a.preferences.budgetMinCents, max: maxA },
    { min: b.preferences.budgetMinCents, max: maxB },
    Math.max(maxA, maxB, 1) * BUDGET_TOLERANCE,
  );
}

function peopleArea(a: CompatibilityProfile, b: CompatibilityProfile) {
  if (!a.citySlug || !b.citySlug) return null;
  if (a.citySlug !== b.citySlug) return 0;

  const wantedA = a.lookingForRoom ? a.wantedNeighborhoods : [];
  const wantedB = b.lookingForRoom ? b.wantedNeighborhoods : [];

  return wantedA.length === 0 ||
    wantedB.length === 0 ||
    wantedA.some((slug) => wantedB.includes(slug))
    ? 1
    : 0.5;
}

function peopleMoveIn(a: CompatibilityProfile, b: CompatibilityProfile) {
  if (!a.lookingForRoom || !b.lookingForRoom || !a.moveInDate || !b.moveInDate) return null;

  const apartDays = Math.abs(calendarDay(a.moveInDate) - calendarDay(b.moveInDate)) / DAY_MS;

  return 1 - Math.max(apartDays - MOVE_IN_TOGETHER_DAYS, 0) / MOVE_IN_FALLOFF_DAYS;
}

function peopleStay(a: CompatibilityProfile, b: CompatibilityProfile) {
  if (!a.lookingForRoom || !b.lookingForRoom || a.stayMonths === null || b.stayMonths === null) {
    return null;
  }

  return Math.min(a.stayMonths, b.stayMonths) / Math.max(a.stayMonths, b.stayMonths);
}

/** One side's stance on the other's pet: a rule against it, or a welcome. */
function petStance(owner: CompatibilityProfile, other: CompatibilityProfile) {
  if (!has(owner, 'HAS_PET')) return null;
  if (other.preferences.pets === false) return 0;

  return has(other, 'PET_FRIENDLY') || has(other, 'HAS_PET') || other.preferences.pets === true
    ? 1
    : null;
}

/** One side's no-smokers rule, met by the other's `NON_SMOKER` tag. */
function smokingStance(strict: CompatibilityProfile, other: CompatibilityProfile) {
  return strict.preferences.smoking === false && has(other, 'NON_SMOKER') ? 1 : null;
}

/** How well two people would live together, 0–100, or null when too little is known. */
export function scoreProfiles(a: CompatibilityProfile, b: CompatibilityProfile): number | null {
  return combine([
    factor(WEIGHTS.budget, peopleBudget(a, b)),
    factor(WEIGHTS.area, peopleArea(a, b)),
    factor(WEIGHTS.moveIn, peopleMoveIn(a, b)),
    factor(WEIGHTS.stay, peopleStay(a, b)),
    factor(WEIGHTS.pets, worst(petStance(a, b), petStance(b, a))),
    factor(WEIGHTS.smoking, worst(smokingStance(a, b), smokingStance(b, a))),
    factor(WEIGHTS.schedule, sameLean(a, b, ['EARLY_BIRD', 'NIGHT_OWL'], 0)),
    factor(WEIGHTS.social, sameLean(a, b, ['QUIET', 'SOCIAL'], 0.3)),
    factor(WEIGHTS.tidiness, has(a, 'TIDY') && has(b, 'TIDY') ? 1 : null),
    factor(WEIGHTS.occupation, sameLean(a, b, ['STUDENT', 'PROFESSIONAL'], 0.6)),
  ]);
}
