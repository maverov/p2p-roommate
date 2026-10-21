import { describe, expect, it } from 'vitest';

import { publicListingLocation } from './listing-location';

describe('public listing locations', () => {
  it('removes the street address and rounds both coordinates without changing the owner record', () => {
    const privateListing = {
      id: 'listing',
      addressLine: '12 Private Street',
      latitude: 42.697743,
      longitude: 23.321912,
    };
    const publicListing = publicListingLocation(privateListing);
    expect(publicListing).toEqual({
      id: 'listing',
      addressLine: null,
      latitude: 42.698,
      longitude: 23.322,
    });
    expect(privateListing.addressLine).toBe('12 Private Street');
    expect(privateListing.latitude).toBe(42.697743);
  });

  it('keeps missing coordinates missing', () => {
    expect(publicListingLocation({ addressLine: null, latitude: null, longitude: null })).toEqual({
      addressLine: null,
      latitude: null,
      longitude: null,
    });
  });
});
