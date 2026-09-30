import type { ListingHousehold, UpdateListingInput } from './schemas';
import { parseListingHousehold } from './schemas';
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
  monthlyRent: string;
  deposit: string;
  availableFrom: string;
  /** The map pin; `null` until the owner drops one. */
  location: { latitude: number; longitude: number } | null;
  isFurnished: boolean;
  internetIncluded: boolean;
  utilitiesIncluded: boolean;
  petsAllowed: boolean;
  nearMetro: boolean;
  roommateFriendly: boolean;
  privateBathroom: boolean;
  couplesAllowed: boolean;
  smokingAllowed: boolean;
  household: HouseholdFormValues;
  description: string;
  amenities: string[];
  rules: string[];
  images: Array<{ url: string; alt: string }>;
  status: 'DRAFT' | 'PUBLISHED';
};

/** Tri-state selects: '' is "not said", which is different from "no". */
type TriState = '' | 'true' | 'false';

/** The room, stay and household fields, as strings the way inputs hold them. */
export type HouseholdFormValues = {
  roomType: string;
  minStayMonths: string;
  maxStayMonths: string;
  size: string;
  genders: string;
  ageMin: string;
  ageMax: string;
  occupation: string;
  smokers: TriState;
  pets: TriState;
  cleanliness: string;
  social: string;
  guests: string;
  preferredAgeMin: string;
  preferredAgeMax: string;
};

const emptyHousehold = (): HouseholdFormValues => ({
  roomType: '',
  minStayMonths: '',
  maxStayMonths: '',
  size: '',
  genders: '',
  ageMin: '',
  ageMax: '',
  occupation: '',
  smokers: '',
  pets: '',
  cleanliness: '',
  social: '',
  guests: '',
  preferredAgeMin: '',
  preferredAgeMax: '',
});

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
  monthlyRent: '',
  deposit: '',
  availableFrom: '',
  location: null,
  isFurnished: false,
  internetIncluded: false,
  utilitiesIncluded: false,
  petsAllowed: false,
  nearMetro: false,
  roommateFriendly: false,
  privateBathroom: false,
  couplesAllowed: false,
  smokingAllowed: false,
  household: emptyHousehold(),
  description: '',
  amenities: [],
  rules: [],
  images: [],
  status: 'DRAFT',
});

/** Cents are the storage unit; the form edits euros, so an absent price stays empty. */
const centsToUnits = (cents: number | null) => (cents === null ? '' : String(cents / 100));

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
    monthlyRent: centsToUnits(listing.monthlyRentCents),
    deposit: centsToUnits(listing.depositCents),
    availableFrom: dateToInput(listing.availableFrom),
    location:
      listing.latitude !== null && listing.longitude !== null
        ? { latitude: listing.latitude, longitude: listing.longitude }
        : null,
    isFurnished: listing.isFurnished,
    internetIncluded: listing.internetIncluded,
    utilitiesIncluded: listing.utilitiesIncluded,
    petsAllowed: listing.petsAllowed,
    nearMetro: listing.nearMetro,
    roommateFriendly: listing.roommateFriendly,
    privateBathroom: listing.privateBathroom,
    couplesAllowed: listing.couplesAllowed,
    smokingAllowed: listing.smokingAllowed,
    household: householdToFormValues(listing),
    description: listing.description,
    amenities: listing.amenities ?? [],
    rules: listing.rules ?? [],
    images: listing.images.map((image) => ({ url: image.url, alt: image.alt ?? '' })),
    // Only used in create mode; edit mode leaves status to the My listings actions.
    status: 'DRAFT',
  };
}

const triState = (value: boolean | undefined): TriState =>
  value === undefined ? '' : value ? 'true' : 'false';
const fromTriState = (value: TriState) => (value === '' ? undefined : value === 'true');
const optionalNumber = (value: string) => (value.trim() === '' ? undefined : Number(value));
const optionalEnum = <T extends string>(value: string) => (value === '' ? undefined : (value as T));

function householdToFormValues(listing: ListingDTO): HouseholdFormValues {
  const household = parseListingHousehold(listing.household);

  return {
    roomType: listing.roomType ?? '',
    minStayMonths: numberToInput(listing.minStayMonths),
    maxStayMonths: numberToInput(listing.maxStayMonths),
    size: household.size === undefined ? '' : String(household.size),
    genders: household.genders ?? '',
    ageMin: household.ageMin === undefined ? '' : String(household.ageMin),
    ageMax: household.ageMax === undefined ? '' : String(household.ageMax),
    occupation: household.occupation ?? '',
    smokers: triState(household.smokers),
    pets: triState(household.pets),
    cleanliness: household.cleanliness ?? '',
    social: household.social ?? '',
    guests: household.guests ?? '',
    preferredAgeMin:
      household.preferredAgeMin === undefined ? '' : String(household.preferredAgeMin),
    preferredAgeMax:
      household.preferredAgeMax === undefined ? '' : String(household.preferredAgeMax),
  };
}

/**
 * The API shape of the room, stay and household fields. Empty inputs become `null`
 * for the nullable columns (so an edit can clear them) and are left out of the jsonb.
 */
export function householdFromFormValues(values: HouseholdFormValues) {
  const household: ListingHousehold = {
    size: optionalNumber(values.size),
    genders: optionalEnum<NonNullable<ListingHousehold['genders']>>(values.genders),
    ageMin: optionalNumber(values.ageMin),
    ageMax: optionalNumber(values.ageMax),
    occupation: optionalEnum<NonNullable<ListingHousehold['occupation']>>(values.occupation),
    smokers: fromTriState(values.smokers),
    pets: fromTriState(values.pets),
    cleanliness: optionalEnum<NonNullable<ListingHousehold['cleanliness']>>(values.cleanliness),
    social: optionalEnum<NonNullable<ListingHousehold['social']>>(values.social),
    guests: optionalEnum<NonNullable<ListingHousehold['guests']>>(values.guests),
    preferredAgeMin: optionalNumber(values.preferredAgeMin),
    preferredAgeMax: optionalNumber(values.preferredAgeMax),
  };

  return {
    roomType: optionalEnum<NonNullable<UpdateListingInput['roomType']>>(values.roomType) ?? null,
    minStayMonths: optionalNumber(values.minStayMonths) ?? null,
    maxStayMonths: optionalNumber(values.maxStayMonths) ?? null,
    // JSON drops `undefined` keys, so unanswered fields are simply absent.
    household,
  };
}
