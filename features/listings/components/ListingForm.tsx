'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

import type { CreateListingInput, UpdateListingInput } from '@/features/listings/schemas';
import { LocationPicker } from '@/features/maps/components/LocationPicker';
import { PhotoUploadButton } from '@/features/uploads/components/PhotoUploadButton';
import { useRouterRefresh } from '@/hooks';
import { apiClient } from '@/lib/api-client';
import type { CityId } from '@/lib/areas';
import {
  CITY_IDS,
  cityLabels,
  getNeighborhoodsByCity,
  isCityId,
} from '@/lib/areas';
import { PLATFORM_CURRENCY } from '@/lib/currency';
import { IMAGE_UPLOAD } from '@/lib/images';
import type { Locale } from '@/lib/i18n';
import { PROPERTY_TYPES, ROOMMATE_PREFERENCES } from '@/lib/labels';
import { BULGARIA_CENTER, CITY_CENTERS } from '@/lib/map';
import { routes } from '@/lib/routes';
import {
  emptyListingFormValues,
  householdFromFormValues,
  type ListingFormValues,
} from '../form-values';
import type { ListingDTO } from '../server/repository';

import { HouseholdFields } from './HouseholdFields';

type Props = {
  locale: Locale;
  /**
   * Absent means create. Present means edit an existing listing, which changes
   * the request from POST to PATCH and hides the publish/draft picker — status
   * transitions belong to the publish/pause/archive actions on My listings, and
   * routing them through this form would silently un-pause a paused listing.
   */
  edit?: {
    listingId: string;
    values: ListingFormValues;
  };
};

const LABEL = 'block text-[13px] font-medium text-brand-ink mb-1';
const FIELD =
  'w-full rounded-[10px] border border-brand-border bg-white px-3 py-2 text-[14px] text-brand-ink outline-none transition placeholder:text-brand-muted/60 focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta/30';
const SECTION = 'space-y-4 rounded-2xl border border-brand-border bg-brand-chip/30 p-5';
const SECTION_TITLE = 'text-[15px] font-semibold text-brand-ink mb-4';
const CHECKBOX_ROW = 'flex items-center gap-2 text-[14px] text-brand-ink select-none';
/** Matches `images: z.array(...).max(12)` in the listing schema. */
const MAX_IMAGES = 12;

export function ListingForm({ locale, edit }: Props) {
  const t = useTranslations('listings.form');
  const tEnums = useTranslations('enums');
  const { isRefreshing, refresh } = useRouterRefresh();
  const isEdit = edit !== undefined;
  const [form, setForm] = useState<ListingFormValues>(edit?.values ?? emptyListingFormValues);
  const [amenityInput, setAmenityInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [savedListing, setSavedListing] = useState<ListingDTO | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const neighborhoods = isCityId(form.citySlug)
    ? getNeighborhoodsByCity(form.citySlug as CityId)
    : [];

  const mutation = useMutation({
    mutationFn: (input: CreateListingInput | UpdateListingInput) =>
      edit
        ? apiClient.patch<ListingDTO>(`/api/listings/${edit.listingId}`, input)
        : apiClient.post<ListingDTO>('/api/listings', input),
    onSuccess: (listing) => {
      setSavedListing(listing);
      // The listing detail and My listings pages are server-rendered, so their
      // cached HTML has to be dropped for the edit to be visible on navigation.
      refresh();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });
  // Busy until the refreshed server data is on screen, not just until the request returns.
  const isBusy = mutation.isPending || isRefreshing;

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (status: 'DRAFT' | 'PUBLISHED') => {
    const shared = {
      title: form.title,
      propertyType: form.propertyType as CreateListingInput['propertyType'],
      citySlug: form.citySlug,
      neighborhoodSlug: form.neighborhoodSlug || undefined,
      roommatePreference:
        form.roommatePreference as CreateListingInput['roommatePreference'],
      bedroomCount: Number(form.bedroomCount) || 0,
      bathroomCount: Number(form.bathroomCount) || 0,
      maxOccupants: Number(form.maxOccupants) || 1,
      sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
      floor: form.floor ? Number(form.floor) : undefined,
      totalFloors: form.totalFloors ? Number(form.totalFloors) : undefined,
      // The form edits euros; the API stores integer cents in the platform currency.
      monthlyRentCents: Math.round(Number(form.monthlyRent) * 100),
      depositCents: form.deposit ? Math.round(Number(form.deposit) * 100) : undefined,
      currency: PLATFORM_CURRENCY,
      availableFrom: form.availableFrom ? new Date(form.availableFrom) : undefined,
      latitude: form.location?.latitude ?? null,
      longitude: form.location?.longitude ?? null,
      isFurnished: form.isFurnished,
      internetIncluded: form.internetIncluded,
      utilitiesIncluded: form.utilitiesIncluded,
      petsAllowed: form.petsAllowed,
      nearMetro: form.nearMetro,
      roommateFriendly: form.roommateFriendly,
      privateBathroom: form.privateBathroom,
      couplesAllowed: form.couplesAllowed,
      smokingAllowed: form.smokingAllowed,
      ...householdFromFormValues(form.household),
      description: form.description,
      amenities: form.amenities,
      rules: form.rules,
      images: form.images.map((img, i) => ({ ...img, sortOrder: i })),
    };

    // Omitting `status` on edit leaves the stored value untouched.
    mutation.mutate(isEdit ? shared : { ...shared, status });
  };

  const addTag = (
    list: 'amenities' | 'rules',
    value: string,
    clear: () => void,
  ) => {
    const tag = value.trim();
    if (!tag) return;
    set(list, [...form[list], tag]);
    clear();
  };

  const removeTag = (list: 'amenities' | 'rules', index: number) =>
    set(
      list,
      form[list].filter((_, i) => i !== index),
    );

  // Functional update: several files can finish uploading before the next render.
  const addImage = (url: string) =>
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url, alt: t('imageAltDefault', { n: prev.images.length + 1 }) }],
    }));

  const setImageAlt = (index: number, alt: string) =>
    set(
      'images',
      form.images.map((image, i) => (i === index ? { ...image, alt } : image)),
    );

  const removeImage = (index: number) =>
    set(
      'images',
      form.images.filter((_, i) => i !== index),
    );

  const handleTagKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    list: 'amenities' | 'rules',
    value: string,
    clear: () => void,
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(list, value, clear);
    }
  };

  if (savedListing) {
    const isPublished = savedListing.status === 'PUBLISHED';
    const message = isEdit
      ? t('successUpdated')
      : isPublished
        ? t('successPublished')
        : t('successDraft');

    return (
      <div className="rounded-2xl border border-brand-border bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-12 text-green-500" />
        <p className="text-[17px] font-semibold text-brand-ink">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isPublished && (
            <Link
              href={routes.listing(locale, savedListing.id)}
              className="rounded-xl bg-brand-terracotta px-5 py-2.5 text-[14px] font-medium text-white hover:bg-brand-terracotta/90"
            >
              {t('viewListing')}
            </Link>
          )}
          {isEdit && (
            <button
              type="button"
              onClick={() => setSavedListing(null)}
              className="rounded-xl border border-brand-border px-5 py-2.5 text-[14px] font-medium text-brand-ink hover:bg-brand-chip"
            >
              {t('editHeading')}
            </button>
          )}
          <Link
            href={routes.myListings(locale)}
            className="rounded-xl border border-brand-border px-5 py-2.5 text-[14px] font-medium text-brand-ink hover:bg-brand-chip"
          >
            {t('backToMyListings')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {mutation.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600">
          {(mutation.error as Error).message || t('validationError')}
        </p>
      )}

      {/* Basic info */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{t('sectionBasic')}</h2>
        <div>
          <label className={LABEL}>{t('title')}</label>
          <input
            className={FIELD}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={t('titlePlaceholder')}
            maxLength={120}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>{t('propertyType')}</label>
            <select
              className={FIELD}
              value={form.propertyType}
              onChange={(e) => set('propertyType', e.target.value)}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tEnums(`propertyType.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>{t('roommatePreference')}</label>
            <select
              className={FIELD}
              value={form.roommatePreference}
              onChange={(e) => set('roommatePreference', e.target.value)}
            >
              {ROOMMATE_PREFERENCES.map((preference) => (
                <option key={preference} value={preference}>
                  {tEnums(`roommatePreference.${preference}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>{t('city')}</label>
            <select
              className={FIELD}
              value={form.citySlug}
              onChange={(e) => {
                set('citySlug', e.target.value);
                set('neighborhoodSlug', '');
                // A pin dropped in the previous city is wrong in the new one.
                set('location', null);
              }}
            >
              {CITY_IDS.map((id) => (
                <option key={id} value={id}>
                  {cityLabels[id][locale]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>{t('neighborhood')}</label>
            <select
              className={FIELD}
              value={form.neighborhoodSlug}
              onChange={(e) => set('neighborhoodSlug', e.target.value)}
            >
              <option value="">{t('anyNeighborhood')}</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label[locale]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className={LABEL}>{t('mapPin')}</p>
          <LocationPicker
            fallbackCenter={
              isCityId(form.citySlug) ? CITY_CENTERS[form.citySlug] : BULGARIA_CENTER
            }
            labels={{
              region: t('mapPin'),
              hint: t('mapPinHint'),
              clear: t('mapPinClear'),
              pin: t('mapPinMarker'),
            }}
            onChange={(location) => set('location', location)}
            value={form.location}
          />
        </div>
      </section>

      {/* Details */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{t('sectionDetails')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ['bedroomCount', t('bedrooms')],
              ['bathroomCount', t('bathrooms')],
              ['maxOccupants', t('maxOccupants')],
              ['sizeSqm', t('sizeSqm')],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={LABEL}>{label}</label>
              <input
                type="number"
                min={0}
                className={FIELD}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>{t('floor')}</label>
            <input
              type="number"
              className={FIELD}
              value={form.floor}
              onChange={(e) => set('floor', e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>{t('totalFloors')}</label>
            <input
              type="number"
              min={0}
              className={FIELD}
              value={form.totalFloors}
              onChange={(e) => set('totalFloors', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{t('sectionPricing')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>{t('monthlyRent')} ({PLATFORM_CURRENCY})</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={FIELD}
              value={form.monthlyRent}
              onChange={(e) => set('monthlyRent', e.target.value)}
              placeholder="450"
            />
          </div>
          <div>
            <label className={LABEL}>{t('deposit')} ({PLATFORM_CURRENCY})</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={FIELD}
              value={form.deposit}
              onChange={(e) => set('deposit', e.target.value)}
              placeholder="450"
            />
          </div>
        </div>
        <div>
          <label className={LABEL}>{t('availableFrom')}</label>
          <input
            type="date"
            className={FIELD}
            value={form.availableFrom}
            onChange={(e) => set('availableFrom', e.target.value)}
          />
        </div>
      </section>

      {/* Features */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{t('sectionFeatures')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ['isFurnished', t('furnished')],
              ['internetIncluded', t('internet')],
              ['utilitiesIncluded', t('utilities')],
              ['petsAllowed', t('pets')],
              ['nearMetro', t('nearMetro')],
              ['roommateFriendly', t('roommateFriendly')],
              ['privateBathroom', t('privateBathroom')],
              ['couplesAllowed', t('couplesAllowed')],
              ['smokingAllowed', t('smokingAllowed')],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={CHECKBOX_ROW}>
              <input
                type="checkbox"
                className="size-[15px] accent-brand-terracotta"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <HouseholdFields
        classes={{ section: SECTION, title: SECTION_TITLE, label: LABEL, field: FIELD }}
        onChange={(household) => set('household', household)}
        value={form.household}
      />

      {/* Description */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{t('sectionDescription')}</h2>
        <div>
          <label className={LABEL}>{t('description')}</label>
          <textarea
            rows={5}
            className={FIELD}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            maxLength={5000}
          />
        </div>

        {/* Amenities tag input */}
        <TagInput
          label={t('amenities')}
          placeholder={t('amenitiesPlaceholder')}
          hint={t('amenitiesHint')}
          tags={form.amenities}
          inputValue={amenityInput}
          onInputChange={setAmenityInput}
          onAdd={() => addTag('amenities', amenityInput, () => setAmenityInput(''))}
          onKeyDown={(e) =>
            handleTagKeyDown(e, 'amenities', amenityInput, () => setAmenityInput(''))
          }
          onRemove={(i) => removeTag('amenities', i)}
        />

        {/* Rules tag input */}
        <TagInput
          label={t('rules')}
          placeholder={t('rulesPlaceholder')}
          hint={t('rulesHint')}
          tags={form.rules}
          inputValue={ruleInput}
          onInputChange={setRuleInput}
          onAdd={() => addTag('rules', ruleInput, () => setRuleInput(''))}
          onKeyDown={(e) =>
            handleTagKeyDown(e, 'rules', ruleInput, () => setRuleInput(''))
          }
          onRemove={(i) => removeTag('rules', i)}
        />
      </section>

      {/* Photos */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{t('sectionImages')}</h2>
        {form.images.length > 0 && (
          <ul className="mb-3 space-y-2">
            {form.images.map((img, i) => (
              <li
                key={img.url}
                className="flex items-center gap-3 rounded-xl border border-brand-border bg-white p-2 text-[13px]"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-brand-chip">
                  <Image alt="" className="object-cover" fill sizes="64px" src={img.url} />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor={`image-alt-${i}`}>
                    {t('imageAlt')}
                  </label>
                  <input
                    className={FIELD}
                    id={`image-alt-${i}`}
                    maxLength={160}
                    onChange={(e) => setImageAlt(i, e.target.value)}
                    placeholder={t('imageAlt')}
                    value={img.alt}
                  />
                </div>
                {i === 0 && (
                  <span className="shrink-0 rounded-full bg-brand-chip px-2 py-0.5 text-[12px] font-medium text-brand-ink">
                    {t('coverBadge')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={t('removeImage')}
                  className="shrink-0 p-1 text-brand-muted hover:text-red-500"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <PhotoUploadButton
          label={t('uploadPhotos')}
          multiple
          onUploaded={addImage}
          purpose="listings"
          remaining={MAX_IMAGES - form.images.length}
        />
        <p className="mt-2 text-[12px] text-brand-muted">
          {form.images.length >= MAX_IMAGES
            ? t('photoLimit', { max: MAX_IMAGES })
            : t('photoHint', { mb: IMAGE_UPLOAD.maxBytes / (1024 * 1024), max: MAX_IMAGES })}
        </p>
      </section>

      {/* Status + submit */}
      <section className={SECTION}>
        {isEdit ? (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleSubmit(form.status)}
              className="flex items-center gap-2 rounded-xl bg-brand-terracotta px-6 py-2.5 text-[14px] font-medium text-white hover:bg-brand-terracotta/90 disabled:opacity-60"
            >
              {isBusy && <Loader2 className="size-4 animate-spin" />}
              {isBusy ? t('saving') : t('saveChanges')}
            </button>
          </div>
        ) : (
          <>
            <h2 className={SECTION_TITLE}>{t('sectionStatus')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatusOption
                active={form.status === 'DRAFT'}
                onClick={() => set('status', 'DRAFT')}
                title={t('statusDraft')}
                hint={t('statusDraftHint')}
              />
              <StatusOption
                active={form.status === 'PUBLISHED'}
                onClick={() => set('status', 'PUBLISHED')}
                title={t('statusPublished')}
                hint={t('statusPublishedHint')}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleSubmit(form.status)}
                className="flex items-center gap-2 rounded-xl bg-brand-terracotta px-6 py-2.5 text-[14px] font-medium text-white hover:bg-brand-terracotta/90 disabled:opacity-60"
              >
                {isBusy && <Loader2 className="size-4 animate-spin" />}
                {form.status === 'DRAFT' ? t('saveDraft') : t('publish')}
              </button>
            </div>
          </>
        )}
      </section>
    </form>
  );
}

/* ─── small sub-components ─────────────────────────────────────────────── */

type TagInputProps = {
  label: string;
  placeholder: string;
  hint: string;
  tags: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
};

function TagInput({
  label,
  placeholder,
  hint,
  tags,
  inputValue,
  onInputChange,
  onAdd,
  onKeyDown,
  onRemove,
}: TagInputProps) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <p className="mb-1.5 text-[12px] text-brand-muted">{hint}</p>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="flex items-center gap-1 rounded-full bg-brand-chip px-2.5 py-0.5 text-[13px] text-brand-ink"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-brand-muted hover:text-red-500"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={FIELD}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl border border-brand-border px-3 py-2 text-[13px] hover:bg-brand-chip"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function StatusOption({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition ${
        active
          ? 'border-brand-terracotta bg-brand-terracotta/5'
          : 'border-brand-border hover:border-brand-terracotta/50'
      }`}
    >
      <div className="text-[14px] font-semibold text-brand-ink">{title}</div>
      <div className="mt-0.5 text-[12px] text-brand-muted">{hint}</div>
    </button>
  );
}
