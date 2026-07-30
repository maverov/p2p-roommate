import type { ListingDTO } from './server/repository';

/**
 * The listing form's own shape and the mapping onto it from a stored listing.
 *
 * Deliberately kept out of `components/ListingForm.tsx`: that module is
 * `'use client'`, so everything it exports becomes a client reference and the
 * server cannot call it. The edit page runs this mapping on the server, so it
 * has to live in a module with no boundary directive of its own.
 *
 * Every field is a string or boolean because that is what form inputs produce;
 * parsing to the API's numbers and dates happens once, on submit.
 */
export type ListingFormValues = {
  title: string;
  propertyType: string;
  citySlug: string;
  neighborhoodSlug: string;
  roommatePreference: string;
  bedroomCount: string;
  bathroomCount: string;
  maxOccupants: string;
  sizeSqm: string;
  floor: string;
  totalFloors: string;
  monthlyRentBGN: string;
  depositBGN: string;
  availableFrom: string;
  isFurnished: boolean;
  internetIncluded: boolean;
  utilitiesIncluded: boolean;
  petsAllowed: boolean;
  nearMetro: boolean;
  roommateFriendly: boolean;
  description: string;
  amenities: string[];
  rules: string[];
  images: Array<{ url: string; alt: string }>;
  status: 'DRAFT' | 'PUBLISHED';
};

export const emptyListingFormValues = (): ListingFormValues => ({
  title: '',
  propertyType: 'ROOM',
  citySlug: 'sofia',
  neighborhoodSlug: '',
  roommatePreference: 'ANY',
  bedroomCount: '1',
  bathroomCount: '1',
  maxOccupants: '2',
  sizeSqm: '',
  floor: '',
  totalFloors: '',
  monthlyRentBGN: '',
  depositBGN: '',
  availableFrom: '',
  isFurnished: false,
  internetIncluded: false,
  utilitiesIncluded: false,
  petsAllowed: false,
  nearMetro: false,
  roommateFriendly: false,
  description: '',
  amenities: [],
  rules: [],
  images: [],
  status: 'DRAFT',
});

/** Cents are the storage unit; the form edits BGN, so an absent price stays empty. */
const centsToBGN = (cents: number | null) => (cents === null ? '' : String(cents / 100));

const numberToInput = (value: number | null) => (value === null ? '' : String(value));

/** `<input type="date">` only accepts `YYYY-MM-DD`. */
const dateToInput = (value: Date | string | null) => {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

/** Maps a stored listing onto the form. Called on the server by the edit page. */
export function listingToFormValues(listing: ListingDTO): ListingFormValues {
  return {
    title: listing.title,
    propertyType: listing.propertyType,
    citySlug: listing.citySlug,
    neighborhoodSlug: listing.neighborhoodSlug ?? '',
    roommatePreference: listing.roommatePreference,
    bedroomCount: String(listing.bedroomCount),
    bathroomCount: String(listing.bathroomCount),
    maxOccupants: String(listing.maxOccupants),
    sizeSqm: numberToInput(listing.sizeSqm),
    floor: numberToInput(listing.floor),
    totalFloors: numberToInput(listing.totalFloors),
    monthlyRentBGN: centsToBGN(listing.monthlyRentCents),
    depositBGN: centsToBGN(listing.depositCents),
    availableFrom: dateToInput(listing.availableFrom),
    isFurnished: listing.isFurnished,
    internetIncluded: listing.internetIncluded,
    utilitiesIncluded: listing.utilitiesIncluded,
    petsAllowed: listing.petsAllowed,
    nearMetro: listing.nearMetro,
    roommateFriendly: listing.roommateFriendly,
    description: listing.description,
    amenities: listing.amenities ?? [],
    rules: listing.rules ?? [],
    images: listing.images.map((image) => ({ url: image.url, alt: image.alt ?? '' })),
    // Only used in create mode; edit mode leaves status to the My listings actions.
    status: 'DRAFT',
  };
}
