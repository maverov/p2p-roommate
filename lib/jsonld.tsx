import { ReactNode } from 'react';

import { CONTACT_EMAILS } from '@/lib/company';

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * `JSON.stringify` leaves `<` untouched, so user text containing `</script>` (a listing
 * title, a profile bio) would close the tag and run as HTML. `<` is the same
 * character to every JSON parser, so the structured data is unchanged.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function JsonLd({ data }: JsonLdProps): ReactNode {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      suppressHydrationWarning
    />
  );
}

/**
 * Who runs the site. A plain `Organization`: Stay.bg is a platform between owners and
 * tenants, not a `RealEstateAgent`. `logo` and `sameAs` (the social profiles) are left
 * out until the logo file and the accounts exist, since Google checks both.
 */
export function OrganizationJsonLd({ appUrl }: { appUrl: string }): ReactNode {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Stay.bg',
    url: appUrl,
    description:
      'Rooms, flats and roommates across Bulgaria, straight from the people who let them. No agents, no commission.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONTACT_EMAILS.support,
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

/** The site itself, on the home page: Google reads its name for the site name in results. */
export function WebSiteJsonLd({ appUrl }: { appUrl: string }): ReactNode {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Stay.bg',
        url: appUrl,
        inLanguage: ['bg-BG', 'en-US'],
      }}
    />
  );
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
