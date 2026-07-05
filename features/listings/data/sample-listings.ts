import type { ListingDetail } from '../types';

export const listingDetails: ListingDetail[] = [
  {
    id: '1',
    amenities: ['Fast Wi-Fi', 'Furnished', 'Desk', 'Washer'],
    availableFrom: 'Available now',
    bathroomCount: 1,
    bedroomCount: 1,
    city: 'Sofia',
    description:
      'A bright private room in a calm apartment near parks, transit, and everyday shops. Best for someone who wants a clean base with a respectful shared-home rhythm.',
    deposit: '420 EUR',
    images: [
      {
        alt: 'Sunny private room with warm wood flooring',
        url: 'https://www.e-architect.com/wp-content/uploads/2017/09/tribeca-loft-residential-apartment-new-york-city-x010917-av5.jpg',
      },
    ],
    maxOccupants: 1,
    monthlyRent: '420 EUR',
    neighborhood: 'Geo Milev',
    propertyType: 'Private room',
    rules: ['No smoking indoors', 'Quiet hours after 22:00', 'Long-term preferred'],
    sizeSqm: 15,
    title: 'Sunny room in Geo Milev',
  },
  {
    id: '2',
    amenities: ['Balcony', 'Air conditioning', 'Elevator', 'Dishwasher'],
    availableFrom: 'From August 1',
    bathroomCount: 1,
    bedroomCount: 2,
    city: 'Plovdiv',
    description:
      'A central apartment with a practical layout, good daylight, and a balcony for slow mornings. Suitable for two roommates or a couple.',
    deposit: '780 EUR',
    images: [
      {
        alt: 'Bright apartment living area with balcony access',
        url: 'https://scontent.fsof8-1.fna.fbcdn.net/v/t39.30808-6/498599158_545602795277750_6047198148928881010_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1300&ctp=p526x296&_nc_cat=111&ccb=1-7&_nc_sid=aa7b47&_nc_ohc=2BNP3BJ-KugQ7kNvwEFLmsV&_nc_oc=AdrYm0tmja9yNYBHRb91q-U6rOFkYIL7mP5YwJGf4JdgjfWTdEFOjsQxO2szAAsk2j4v5_nXe-IcU6gGnAKh1Mxf&_nc_zt=23&_nc_ht=scontent.fsof8-1.fna&_nc_gid=03RepBf5M5T-lMLNgx7h6w&_nc_ss=7b289&oh=00_Af9VSTlJKOYNN2FE-zsOSe4QGxj6YwAb2nBH2rKM0Ks3mg&oe=6A4078E4',
      },
    ],
    maxOccupants: 2,
    monthlyRent: '780 EUR',
    neighborhood: 'Center',
    propertyType: 'Apartment',
    rules: ['Pets negotiable', 'No parties', 'Proof of income required'],
    sizeSqm: 65,
    title: 'Bright apartment with balcony',
  },
  {
    id: '3',
    amenities: ['Near sea garden', 'Furnished', 'Kitchenette', 'Air conditioning'],
    availableFrom: 'Available now',
    bathroomCount: 1,
    bedroomCount: 1,
    city: 'Varna',
    description:
      'Compact and comfortable studio close to Varna Sea Garden, built for someone who values walkability and an easy coastal routine.',
    deposit: '650 EUR',
    images: [
      {
        alt: 'Compact furnished studio with cozy neutral styling',
        url: 'https://i.pinimg.com/1200x/f5/8d/3d/f58d3df50a85b35efa534dc381111b36.jpg',
      },
    ],
    maxOccupants: 1,
    monthlyRent: '650 EUR',
    neighborhood: 'Sea Garden',
    propertyType: 'Studio',
    rules: ['No smoking', 'Single occupant preferred'],
    sizeSqm: 32,
    title: 'Cozy studio near the Sea Garden',
  },
];

export function getListingById(id: string) {
  return listingDetails.find((listing) => listing.id === id) ?? null;
}
