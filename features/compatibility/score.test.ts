import { describe, expect, it } from 'vitest';

import {
  scoreListing,
  scoreProfiles,
  toCompatibilityProfile,
  type CompatibilityListing,
  type CompatibilityProfile,
} from './score';

function profile(overrides: Partial<CompatibilityProfile> = {}): CompatibilityProfile {
  return {
    traits: [],
    preferences: {},
    citySlug: null,
    lookingForRoom: false,
    moveInDate: null,
    stayMonths: null,
    wantedNeighborhoods: [],
    ...overrides,
  };
}

function listing(overrides: Partial<CompatibilityListing> = {}): CompatibilityListing {
  return {
    citySlug: 'sofia',
    neighborhoodSlug: 'lozenets',
    monthlyRentCents: 50_000,
    petsAllowed: false,
    smokingAllowed: false,
    minStayMonths: null,
    maxStayMonths: null,
    availableFrom: null,
    household: {},
    ...overrides,
  };
}

const seeker = profile({
  citySlug: 'sofia',
  lookingForRoom: true,
  preferences: { budgetMaxCents: 50_000 },
  wantedNeighborhoods: ['lozenets'],
});

describe('scoreListing', () => {
  it('is null when too little is known', () => {
    expect(scoreListing(profile(), listing())).toBeNull();
    // A city alone (weight 2) is below the evidence threshold.
    expect(scoreListing(profile({ citySlug: 'sofia' }), listing())).toBeNull();
  });

  it('scores a fit on every stated point high, but not 100 on thin evidence', () => {
    // Budget (3) and area (2) both fit, pulled toward 50% by the prior (2).
    expect(scoreListing(seeker, listing())).toBe(86);
  });

  it('lowers the score as rent goes over budget, down to zero past the tolerance', () => {
    const over = scoreListing(seeker, listing({ monthlyRentCents: 56_250 }))!;

    expect(over).toBeLessThan(100);
    expect(over).toBeGreaterThan(0);
    // Budget (3) scores 0, area (2) scores 1.
    expect(scoreListing(seeker, listing({ monthlyRentCents: 70_000 }))).toBe(43);
  });

  it('ignores the budget and dates of an unpublished room-wanted post', () => {
    const unpublished = { ...seeker, lookingForRoom: false, moveInDate: '2026-10-01' };

    // Only the city is left, which is not enough evidence.
    expect(scoreListing(unpublished, listing({ monthlyRentCents: 90_000 }))).toBeNull();
  });

  it('scores another city as a mismatch and another neighbourhood as partial', () => {
    expect(scoreListing(seeker, listing({ citySlug: 'varna', neighborhoodSlug: null }))).toBe(57);
    expect(scoreListing(seeker, listing({ neighborhoodSlug: 'mladost-1' }))).toBe(71);
  });

  it('treats a pet the listing does not allow as a deal-breaker', () => {
    const withPet = { ...seeker, traits: ['HAS_PET'] as const };

    expect(scoreListing(withPet, listing({ petsAllowed: true }))).toBe(89);
    expect(scoreListing(withPet, listing({ petsAllowed: false }))).toBe(67);
  });

  it('compares smoking, gender and lifestyle with the household', () => {
    const picky = {
      ...seeker,
      traits: ['QUIET', 'TIDY'] as const,
      preferences: { ...seeker.preferences, smoking: false, gender: 'WOMEN_ONLY' as const },
    };
    const match = listing({
      household: {
        size: 2,
        genders: 'FEMALE',
        smokers: false,
        social: 'QUIET',
        cleanliness: 'TIDY',
      },
    });
    const clash = listing({
      household: {
        size: 2,
        genders: 'MALE',
        smokers: true,
        social: 'SOCIAL',
        cleanliness: 'RELAXED',
      },
    });

    // More agreeing evidence than the base case, so a higher score.
    expect(scoreListing(picky, match)).toBe(93);
    expect(scoreListing(picky, clash)).toBeLessThan(50);
  });

  it('skips household factors when nobody lives there', () => {
    const picky = {
      ...seeker,
      preferences: { ...seeker.preferences, gender: 'MEN_ONLY' as const },
    };

    expect(scoreListing(picky, listing({ household: { size: 0, genders: 'FEMALE' } }))).toBe(
      scoreListing(seeker, listing()),
    );
  });

  it('penalises a room that frees up well after the move-in date', () => {
    const dated = { ...seeker, moveInDate: '2026-10-01' };

    expect(scoreListing(dated, listing({ availableFrom: new Date('2026-10-10') }))).toBe(88);
    expect(scoreListing(dated, listing({ availableFrom: new Date('2027-03-01') }))).toBe(75);
  });

  it('checks the stay against the listing minimum and maximum', () => {
    const shortStay = { ...seeker, stayMonths: 3 };

    expect(scoreListing(shortStay, listing({ minStayMonths: 6 }))).toBe(78);
    expect(scoreListing(shortStay, listing({ minStayMonths: 1, maxStayMonths: 6 }))).toBe(88);
  });

  it('ignores a malformed household', () => {
    expect(scoreListing(seeker, listing({ household: { size: 'lots' } }))).toBe(
      scoreListing(seeker, listing()),
    );
  });
});

describe('scoreProfiles', () => {
  const a = profile({ traits: ['EARLY_BIRD', 'QUIET', 'TIDY'], citySlug: 'sofia' });

  it('is null when too little is known', () => {
    expect(scoreProfiles(profile(), profile())).toBeNull();
  });

  it('is symmetric', () => {
    const b = profile({ traits: ['NIGHT_OWL', 'QUIET'], citySlug: 'sofia' });

    expect(scoreProfiles(a, b)).toBe(scoreProfiles(b, a));
  });

  it('rewards the same routine and penalises opposite ones', () => {
    const same = profile({ traits: ['EARLY_BIRD', 'QUIET', 'TIDY'], citySlug: 'sofia' });
    const opposite = profile({ traits: ['NIGHT_OWL', 'SOCIAL'], citySlug: 'sofia' });

    expect(scoreProfiles(a, same)).toBe(89);
    expect(scoreProfiles(a, opposite)).toBeLessThan(50);
  });

  it('does not read a missing tag as its opposite', () => {
    // b states no routine, so only the city is comparable: not enough to score.
    expect(scoreProfiles(a, profile({ citySlug: 'sofia' }))).toBeNull();
  });

  it('treats a pet against a no-pets rule as a deal-breaker', () => {
    const owner = profile({ traits: ['HAS_PET', 'EARLY_BIRD'], citySlug: 'sofia' });
    const strict = profile({
      traits: ['EARLY_BIRD'],
      citySlug: 'sofia',
      preferences: { pets: false },
    });

    expect(scoreProfiles(owner, strict)).toBe(63);
  });

  it('compares budgets, areas and dates of two published posts', () => {
    const post = {
      citySlug: 'sofia',
      lookingForRoom: true,
      wantedNeighborhoods: ['lozenets'],
      moveInDate: '2026-10-01',
      stayMonths: 12,
    };
    const one = profile({ ...post, preferences: { budgetMaxCents: 50_000 } });
    const two = profile({
      ...post,
      moveInDate: '2026-10-20',
      preferences: { budgetMinCents: 40_000, budgetMaxCents: 60_000 },
    });
    const far = profile({
      ...post,
      wantedNeighborhoods: ['mladost-1'],
      moveInDate: '2027-06-01',
      stayMonths: 3,
      preferences: { budgetMinCents: 90_000, budgetMaxCents: 120_000 },
    });

    expect(scoreProfiles(one, two)).toBe(89);
    expect(scoreProfiles(one, far)).toBeLessThan(30);
  });
});

describe('toCompatibilityProfile', () => {
  it('parses stored jsonb defensively', () => {
    expect(
      toCompatibilityProfile({
        traits: ['TIDY', 'free text', 'TIDY'],
        roommatePreferences: { budgetMaxCents: 'a lot' },
        citySlug: 'sofia',
        lookingForRoom: true,
        moveInDate: null,
        stayMonths: null,
        wantedNeighborhoods: ['lozenets', 7],
      }),
    ).toEqual(
      profile({
        traits: ['TIDY'],
        citySlug: 'sofia',
        lookingForRoom: true,
        wantedNeighborhoods: ['lozenets'],
      }),
    );
  });
});
