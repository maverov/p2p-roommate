import { describe, expect, it } from 'vitest';

import {
  createListingInputSchema,
  listingImageInputSchema,
  listListingsQuerySchema,
  updateListingInputSchema,
} from '.';

describe('listing currency', () => {
  const currency = createListingInputSchema.shape.currency;

  it('defaults to EUR on create', () => {
    expect(currency.parse(undefined)).toBe('EUR');
  });

  it('normalises case and whitespace', () => {
    expect(currency.parse(' eur ')).toBe('EUR');
  });

  it('rejects any other currency', () => {
    expect(currency.safeParse('BGN').success).toBe(false);
  });

  it('is left alone by a partial update that omits it', () => {
    expect(updateListingInputSchema.parse({})).not.toHaveProperty('currency');
  });
});

describe('listing kind', () => {
  const shared = {
    title: 'A place',
    description: 'Long enough to pass the minimum description length.',
    citySlug: 'sofia',
    monthlyRentCents: 50_000,
  };
  const home = {
    ...shared,
    propertyType: 'APARTMENT',
    bedroomCount: 2,
    bathroomCount: 1,
    maxOccupants: 3,
  };
  const parking = { ...shared, kind: 'PARKING', parkingType: 'GARAGE' };

  const issuePaths = (input: unknown) => {
    const result = createListingInputSchema.safeParse(input);

    return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
  };

  it('defaults to a home, so a pre-parking payload still parses', () => {
    expect(createListingInputSchema.parse(home).kind).toBe('HOME');
  });

  it('requires the home fields on a home', () => {
    expect(issuePaths({ ...shared, kind: 'HOME' })).toEqual([
      'propertyType',
      'bedroomCount',
      'bathroomCount',
      'maxOccupants',
    ]);
  });

  it('accepts a parking spot without any of them', () => {
    expect(createListingInputSchema.safeParse(parking).success).toBe(true);
  });

  it('requires the kind of space on a parking spot', () => {
    expect(issuePaths({ ...shared, kind: 'PARKING' })).toEqual(['parkingType']);
  });

  it('rejects home fields on a parking spot', () => {
    expect(issuePaths({ ...parking, bedroomCount: 2, roomType: 'SINGLE' })).toEqual([
      'bedroomCount',
      'roomType',
    ]);
  });

  it('searches homes when a URL does not say otherwise', () => {
    expect(listListingsQuerySchema.parse({}).kind).toBe('HOME');
  });
});

describe('listing images', () => {
  it('accepts an uploaded photo', () => {
    const image = {
      url: 'https://abc.public.blob.vercel-storage.com/listings/a.jpg',
      alt: 'Living room',
    };

    expect(listingImageInputSchema.safeParse(image).success).toBe(true);
  });

  it('rejects an external image URL', () => {
    const image = { url: 'https://example.com/a.jpg', alt: 'Living room' };

    expect(listingImageInputSchema.safeParse(image).success).toBe(false);
  });
});
