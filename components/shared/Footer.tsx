import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { Heart } from 'lucide-react';
import { CITY_IDS, getCityLabel } from '@/lib/areas';
import { caveat } from '@/lib/fonts';
import type { Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/utils';

/**
 * Structure only — the headings and labels are message keys resolved at render time,
 * so the columns stay declarative without hardcoding copy.
 */
const FOOTER_COLUMNS = [
  {
    heading: 'explore',
    links: [
      { label: 'findRoom', href: routes.areas },
      { label: 'findRoommate', href: routes.findRoommate },
    ],
  },
  {
    heading: 'host',
    links: [{ label: 'listProperty', href: routes.listProperty }],
  },
  {
    heading: 'support',
    links: [
      { label: 'faq', href: routes.faq },
      { label: 'safetyTips', href: routes.safety },
      { label: 'templates', href: routes.templates },
      { label: 'contact', href: routes.contact },
    ],
  },
  {
    heading: 'about',
    links: [
      { label: 'aboutUs', href: routes.about },
      { label: 'whyUs', href: routes.whyUs },
      { label: 'howItWorks', href: routes.howItWorks },
      { label: 'press', href: routes.press },
      { label: 'privacy', href: routes.privacy },
      { label: 'terms', href: routes.terms },
    ],
  },
] as const;

/** The city list and the link columns share this grid, so their columns line up. */
const COLUMNS = 'grid grid-cols-2 gap-x-10 sm:grid-cols-4 lg:gap-x-8 xl:gap-x-12';

// lucide-react no longer ships brand icons — minimal inline glyphs instead.
function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.5 5.9c-.7.3-1.5.5-2.2.6.8-.5 1.4-1.3 1.7-2.2-.8.5-1.6.8-2.5 1a3.9 3.9 0 0 0-6.7 3.6 11.1 11.1 0 0 1-8.1-4.1 3.9 3.9 0 0 0 1.2 5.2c-.6 0-1.2-.2-1.8-.5v.1c0 1.9 1.4 3.5 3.1 3.8-.6.2-1.2.2-1.8.1a3.9 3.9 0 0 0 3.7 2.7A7.9 7.9 0 0 1 2.3 18a11.1 11.1 0 0 0 6 1.8c7.2 0 11.2-6 11.2-11.2v-.5c.8-.6 1.5-1.3 2-2.2Z" />
    </svg>
  );
}

const SOCIAL_LINKS: ReadonlyArray<{
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'Twitter', href: 'https://twitter.com', icon: TwitterIcon },
];

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'common.footer' });

  return (
    <footer className="bg-brand-cream">
      {/* Wavy transition from page background into the sand footer band */}
      <svg
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block h-10 w-full text-brand-sand md:h-16"
      >
        <path
          fill="currentColor"
          d="M0 40C48 28 96 26 144 36C192 46 240 50 288 40C336 30 384 26 432 36C480 46 528 50 576 40C624 30 672 26 720 36C768 46 816 50 864 40C912 30 960 26 1008 36C1056 46 1104 50 1152 40C1200 30 1248 26 1296 36C1344 46 1392 46 1440 38V72H0V40Z"
        />
      </svg>

      <div className="bg-brand-sand px-6 pb-12 pt-4 lg:px-10">
        {/*
          One grid for the whole band: the cities sit above the link columns, in the same
          middle track, while the logo and socials share the links' row below the divider.
        */}
        <div className="mx-auto grid w-full max-w-[2000px] gap-10 lg:grid-cols-[auto_minmax(0,48rem)_1fr] lg:gap-x-12 xl:gap-x-24">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 justify-self-start lg:col-start-1 lg:row-start-3 lg:self-center"
          >
            <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="#c85b36" />
              <path d="M20 8L26 24H14L20 8Z" fill="white" />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-brand-terracotta">
              stay<span className="text-brand-ink">.bg</span>
            </span>
          </Link>

          <nav aria-labelledby="footer-cities-heading" className="lg:col-start-2 lg:row-start-1">
            <h3
              id="footer-cities-heading"
              className="text-[14px] font-bold leading-5 text-brand-ink"
            >
              {t('citiesHeading')}
            </h3>

            <ul className={cn(COLUMNS, 'mt-3 gap-y-2')}>
              {CITY_IDS.map((citySlug) => (
                <li key={citySlug}>
                  <Link
                    href={routes.area(locale, citySlug)}
                    className="text-[13px] leading-5 text-brand-muted transition hover:text-brand-terracotta"
                  >
                    {getCityLabel(citySlug, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <hr className="border-brand-border/70 lg:col-span-3 lg:row-start-2" />

          <nav
            aria-label={t('label')}
            className={cn(COLUMNS, 'gap-y-8 lg:col-start-2 lg:row-start-3')}
          >
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="text-[14px] font-bold leading-5 text-brand-ink">
                  {t(column.heading)}
                </h3>

                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href(locale)}
                        className="text-[13px] leading-5 text-brand-muted transition hover:text-brand-terracotta"
                      >
                        {t(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Socials + tagline — pinned right */}
          <div className="flex flex-col items-start gap-3.5 lg:col-start-3 lg:row-start-3 lg:items-end lg:self-center lg:justify-self-end">
            <div className="flex items-center gap-3.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-olive text-brand-cream transition hover:bg-brand-terracotta"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <p
              className={`${caveat.className} flex items-center gap-1.5 whitespace-nowrap text-[21px] leading-6 text-brand-ink`}
            >
              {t('madeWith')}
              <Heart size={16} aria-hidden="true" className="fill-red-600 text-red-600" />
              {t('inBulgaria')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
