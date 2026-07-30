import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StateMessage } from '@/components/shared/StateMessage';
import { ListingForm } from '@/features/listings/components/ListingForm';
import { listingToFormValues } from '@/features/listings/form-values';
import { getOwnedListingOrThrow } from '@/features/listings/server/repository';
import { isLocale, type Locale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { tryQuery } from '@/lib/server/safe';
import { requireServerUser } from '@/lib/server/session';

type EditListingPageProps = {
  params: { locale: string; id: string };
};

export async function generateMetadata({ params }: EditListingPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'bg';
  const t = await getTranslations({ locale, namespace: 'listings.form' });

  return {
    title: t('editHeading'),
    // Owner-only form, and the listing is reachable at its public URL anyway.
    robots: { index: false },
  };
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  if (!isLocale(params.locale)) notFound();

  const locale: Locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'listings.form' });
  const user = await requireServerUser(routes.editListing(locale, params.id));

  /*
   * `getOwnedListingOrThrow` scopes the query to the owner, so a listing that
   * belongs to somebody else is indistinguishable from one that does not exist —
   * which is what we want: editing is not an information-disclosure surface.
   * `tryQuery` keeps that 404 separate from a database failure, so an outage
   * renders an error card instead of claiming the listing is gone.
   */
  const outcome = await tryQuery(
    getOwnedListingOrThrow(params.id, user.id),
    `owned listing ${params.id}`,
  );

  if (outcome.status === 'missing') {
    return (
      <PageShell heading={t('editHeading')}>
        <StateMessage
          action={<BackToMyListings label={t('backToMyListings')} locale={locale} />}
          body={t('editNotFoundBody')}
          title={t('editNotFound')}
        />
      </PageShell>
    );
  }

  if (outcome.status === 'failed') {
    return (
      <PageShell heading={t('editHeading')}>
        <StateMessage
          action={<BackToMyListings label={t('backToMyListings')} locale={locale} />}
          body={t('editLoadFailedBody')}
          title={t('editLoadFailed')}
          tone="error"
        />
      </PageShell>
    );
  }

  return (
    <PageShell heading={t('editHeading')}>
      <ListingForm
        edit={{ listingId: outcome.data.id, values: listingToFormValues(outcome.data) }}
        locale={locale}
      />
    </PageShell>
  );
}

function BackToMyListings({ label, locale }: { label: string; locale: Locale }) {
  return (
    <Link
      className="rounded-[10px] bg-brand-terracotta px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-brand-terracotta-hover"
      href={routes.myListings(locale)}
    >
      {label}
    </Link>
  );
}

function PageShell({ children, heading }: { children: React.ReactNode; heading: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
      <h1 className="mb-8 text-[24px] font-bold leading-8 text-brand-ink">{heading}</h1>
      {children}
    </main>
  );
}
