import { ReactNode } from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps): ReactNode {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  );
}

export function OrganizationJsonLd({ appUrl }: { appUrl: string }): ReactNode {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Stay.bg',
    url: appUrl,
    description: 'P2P platform for finding rooms and apartments in Bulgaria without intermediaries',
    logo: `${appUrl}/logo.png`,
    sameAs: [
      'https://facebook.com/staybg',
      'https://instagram.com/staybg',
      'https://twitter.com/staybg',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@stay.bg',
      contactType: 'Customer Service',
      areaServed: ['BG', 'Bulgaria'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Bulgaria',
    },
  };

  return <JsonLd data={organizationData} />;
}

export function ListingJsonLd({
  listing,
  appUrl,
}: {
  listing: {
    id: string;
    title: string;
    description: string;
    city: string;
    address?: string;
    monthlyRent: number;
    currency: string;
    bedroomCount: number;
    bathroomCount: number;
    sizeSqm?: number;
    image?: string;
    /** Absolute canonical URL. Passed in because listing pages are locale-prefixed. */
    url: string;
  };
  appUrl: string;
}): ReactNode {
  const listingData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: listing.title,
    description: listing.description,
    url: listing.url,
    image: listing.image || `${appUrl}/og-image.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address || listing.city,
      addressLocality: listing.city,
      addressCountry: 'BG',
    },
    priceCurrency: listing.currency,
    price: listing.monthlyRent,
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: listing.currency,
      price: listing.monthlyRent,
      billingDuration: 'P1M',
    },
    numberOfBedrooms: listing.bedroomCount,
    numberOfBathrooms: listing.bathroomCount,
    floorSize: listing.sizeSqm
      ? {
          '@type': 'QuantitativeValue',
          value: listing.sizeSqm,
          unitCode: 'MTK',
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: listing.currency,
      price: listing.monthlyRent,
      availability: 'https://schema.org/InStock',
    },
  };

  // Remove undefined fields
  Object.keys(listingData).forEach(
    key => listingData[key] === undefined && delete listingData[key]
  );

  return <JsonLd data={listingData} />;
}

export function ProfileJsonLd({
  profile,
}: {
  profile: {
    name: string;
    /** Absolute canonical URL — profile pages are locale-prefixed. */
    url: string;
    description?: string | null;
    image?: string | null;
    /** Only emitted when there is at least one review to average. */
    ratingValue?: number | null;
    reviewCount?: number;
  };
}): ReactNode {
  const profileData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: profile.url,
    mainEntity: {
      '@type': 'Person',
      name: profile.name,
      url: profile.url,
      description: profile.description || undefined,
      image: profile.image || undefined,
      // Schema.org requires a review count alongside a rating; without reviews
      // the whole block is dropped rather than emitting an unsupported value.
      aggregateRating:
        profile.ratingValue && profile.reviewCount
          ? {
              '@type': 'AggregateRating',
              ratingValue: profile.ratingValue,
              reviewCount: profile.reviewCount,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
    },
  };

  return <JsonLd data={profileData} />;
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}): ReactNode {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={breadcrumbData} />;
}

export function FAQJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}): ReactNode {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <JsonLd data={faqData} />;
}
