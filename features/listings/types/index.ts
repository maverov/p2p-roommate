export type ListingImage = {
  alt: string;
  url: string;
};

export type ListingDetail = {
  id: string;
  amenities: string[];
  availableFrom: string;
  bathroomCount: number;
  bedroomCount: number;
  city: string;
  description: string;
  deposit: string;
  images: ListingImage[];
  maxOccupants: number;
  monthlyRent: string;
  neighborhood: string;
  propertyType: string;
  rules: string[];
  sizeSqm: number;
  title: string;
};
