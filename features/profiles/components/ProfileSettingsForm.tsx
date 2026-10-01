'use client';

import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';

import {
  PROFILE_BIO_MAX_LENGTH,
  parseRoommatePreferences,
  type RoommatePreferences,
  type UpdateProfileInput,
} from '@/features/profiles/schemas';
import { CityCombobox } from '@/features/areas/components/CityCombobox';
import type { EditableProfile } from '@/features/profiles/server/repository';
import { PhotoUploadButton } from '@/features/uploads/components/PhotoUploadButton';
import { apiClient } from '@/lib/api-client';
import { getNeighborhoodsByCity, isCityId } from '@/lib/areas';
import type { Locale } from '@/lib/i18n';
import { PROFILE_TRAITS, type ProfileTrait } from '@/lib/labels';

import { RoomWantedSection, type RoomWantedValue } from './RoomWantedSection';
import { SETTINGS_FIELD, SETTINGS_LABEL, SETTINGS_SECTION, SettingsSaveBar } from './settings-ui';
import { TraitCheckbox } from './TraitCheckbox';

type ProfileSettingsFormProps = {
  userId: string;
  locale: Locale;
  profile: EditableProfile;
};

const GENDERS = ['ANY', 'WOMEN_ONLY', 'MEN_ONLY'] as const;

/** Tri-state selects: '' means "not set", which is different from "no". */
type TriState = '' | 'true' | 'false';

const toTriState = (value: boolean | undefined): TriState =>
  value === undefined ? '' : value ? 'true' : 'false';
const fromTriState = (value: TriState) => (value === '' ? undefined : value === 'true');
const toNumberInput = (value: number | undefined) => (value === undefined ? '' : String(value));
const fromNumberInput = (value: string) => (value.trim() === '' ? undefined : Number(value));
const centsToInput = (cents: number | undefined) =>
  cents === undefined ? '' : String(cents / 100);
const inputToCents = (value: string) =>
  value.trim() === '' ? undefined : Math.round(Number(value) * 100);
const blankToNull = (value: string) => (value.trim() === '' ? null : value.trim());
const blankToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim());

export function ProfileSettingsForm({ userId, locale, profile }: ProfileSettingsFormProps) {
  const t = useTranslations('settings');
  const tEnums = useTranslations('enums');
  const preferences = parseRoommatePreferences(profile.roommatePreferences);

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? '');
  const [publicContactAllowed, setPublicContactAllowed] = useState(profile.publicContactAllowed);
  const [citySlug, setCitySlug] = useState(profile.citySlug ?? '');
  const [neighborhoodSlug, setNeighborhoodSlug] = useState(profile.neighborhoodSlug ?? '');
  const [languages, setLanguages] = useState(profile.languages.join(', '));
  const [traits, setTraits] = useState<ProfileTrait[]>(profile.traits);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [gender, setGender] = useState<string>(preferences.gender ?? '');
  const [smoking, setSmoking] = useState<TriState>(toTriState(preferences.smoking));
  const [pets, setPets] = useState<TriState>(toTriState(preferences.pets));
  const [quietHoursFrom, setQuietHoursFrom] = useState(preferences.quietHoursFrom ?? '');
  const [roomWanted, setRoomWanted] = useState<RoomWantedValue>({
    lookingForRoom: profile.lookingForRoom,
    wantedNeighborhoods: profile.wantedNeighborhoods,
    moveInDate: profile.moveInDate ?? '',
    stayMonths: profile.stayMonths === null ? '' : String(profile.stayMonths),
    budgetMin: centsToInput(preferences.budgetMinCents),
    budgetMax: centsToInput(preferences.budgetMaxCents),
  });
  const [ageMin, setAgeMin] = useState(toNumberInput(preferences.ageMin));
  const [ageMax, setAgeMax] = useState(toNumberInput(preferences.ageMax));
  const [occupation, setOccupation] = useState(preferences.occupation ?? '');
  const [environment, setEnvironment] = useState(preferences.environment ?? '');

  const neighborhoods = isCityId(citySlug) ? getNeighborhoodsByCity(citySlug) : [];

  const save = useMutation({
    mutationFn: (input: UpdateProfileInput) => apiClient.patch(`/api/profiles/${userId}`, input),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const roommatePreferences: RoommatePreferences = {
      gender: gender ? (gender as RoommatePreferences['gender']) : undefined,
      smoking: fromTriState(smoking),
      pets: fromTriState(pets),
      quietHoursFrom: blankToUndefined(quietHoursFrom),
      budgetMinCents: inputToCents(roomWanted.budgetMin),
      budgetMaxCents: inputToCents(roomWanted.budgetMax),
      ageMin: fromNumberInput(ageMin),
      ageMax: fromNumberInput(ageMax),
      occupation: blankToUndefined(occupation),
      environment: blankToUndefined(environment),
    };

    save.mutate({
      displayName: displayName.trim(),
      bio: blankToNull(bio),
      phoneNumber: blankToNull(phoneNumber),
      publicContactAllowed,
      citySlug: blankToNull(citySlug),
      neighborhoodSlug: isCityId(citySlug) ? blankToNull(neighborhoodSlug) : null,
      avatarUrl,
      languages: languages
        .split(',')
        .map((language) => language.trim())
        .filter(Boolean),
      traits,
      roommatePreferences,
      lookingForRoom: roomWanted.lookingForRoom,
      wantedNeighborhoods: isCityId(citySlug) ? roomWanted.wantedNeighborhoods : [],
      moveInDate: roomWanted.moveInDate || null,
      stayMonths: roomWanted.stayMonths ? Number(roomWanted.stayMonths) : null,
    });
  };

  // Any edit after a save clears the "saved" state, so it never describes stale input.
  const edited =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      if (save.isSuccess || save.isError) save.reset();
      setter(value);
    };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <section className={SETTINGS_SECTION}>
        <header>
          <h2 className="text-[17px] font-semibold text-brand-ink">{t('profile.heading')}</h2>
          <p className="mt-1 text-[13px] text-brand-muted">{t('profile.description')}</p>
        </header>

        <p className={SETTINGS_LABEL} id="avatar-label">
          {t('profile.avatar')}
        </p>
        <div aria-labelledby="avatar-label" className="flex items-center gap-4" role="group">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-brand-chip">
            {avatarUrl && (
              <Image alt="" className="object-cover" fill sizes="80px" src={avatarUrl} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PhotoUploadButton
              label={t('profile.avatarUpload')}
              onUploaded={edited(setAvatarUrl)}
              purpose="avatars"
            />
            {avatarUrl && (
              <button
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[13px] text-brand-muted hover:text-red-600"
                onClick={() => edited(setAvatarUrl)(null)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
                {t('profile.avatarRemove')}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={SETTINGS_LABEL} htmlFor="displayName">
            {t('profile.displayName')}
          </label>
          <input
            className={SETTINGS_FIELD}
            id="displayName"
            maxLength={120}
            minLength={2}
            onChange={(e) => edited(setDisplayName)(e.target.value)}
            required
            value={displayName}
          />
        </div>

        <div>
          <label className={SETTINGS_LABEL} htmlFor="bio">
            {t('profile.bio')}
          </label>
          <textarea
            aria-describedby="bio-hint"
            className={`${SETTINGS_FIELD} min-h-28`}
            id="bio"
            maxLength={PROFILE_BIO_MAX_LENGTH}
            onChange={(e) => edited(setBio)(e.target.value)}
            value={bio}
          />
          <p className="mt-1 text-[12px] text-brand-muted" id="bio-hint">
            {t('profile.bioHint', { max: PROFILE_BIO_MAX_LENGTH })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={SETTINGS_LABEL} htmlFor="city">
              {t('profile.city')}
            </label>
            <CityCombobox
              classNames={{ input: SETTINGS_FIELD }}
              emptyLabel={t('profile.none')}
              id="city"
              locale={locale}
              onChange={(city) => {
                edited(setCitySlug)(city);
                setNeighborhoodSlug('');
                // Wanted neighbourhoods belong to the old city.
                setRoomWanted((current) => ({ ...current, wantedNeighborhoods: [] }));
              }}
              value={isCityId(citySlug) ? citySlug : ''}
            />
          </div>
          <div>
            <label className={SETTINGS_LABEL} htmlFor="neighborhood">
              {t('profile.neighborhood')}
            </label>
            <select
              className={SETTINGS_FIELD}
              disabled={neighborhoods.length === 0}
              id="neighborhood"
              onChange={(e) => edited(setNeighborhoodSlug)(e.target.value)}
              value={neighborhoodSlug}
            >
              <option value="">{t('profile.none')}</option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood.id} value={neighborhood.id}>
                  {neighborhood.label[locale]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={SETTINGS_LABEL} htmlFor="languages">
            {t('profile.languages')}
          </label>
          <input
            aria-describedby="languages-hint"
            className={SETTINGS_FIELD}
            id="languages"
            onChange={(e) => edited(setLanguages)(e.target.value)}
            value={languages}
          />
          <p className="mt-1 text-[12px] text-brand-muted" id="languages-hint">
            {t('profile.languagesHint')}
          </p>
        </div>

        <fieldset aria-describedby="traits-hint">
          <legend className={SETTINGS_LABEL}>{t('profile.traits')}</legend>
          <p className="mb-2 text-[12px] text-brand-muted" id="traits-hint">
            {t('profile.traitsHint')}
          </p>
          <div className="flex flex-wrap gap-2">
            {PROFILE_TRAITS.map((trait) => (
              <TraitCheckbox
                checked={traits.includes(trait)}
                key={trait}
                label={tEnums(`profileTrait.${trait}`)}
                onChange={() =>
                  edited(setTraits)(
                    traits.includes(trait)
                      ? traits.filter((current) => current !== trait)
                      : [...traits, trait],
                  )
                }
              />
            ))}
          </div>
        </fieldset>

        <div>
          <label className={SETTINGS_LABEL} htmlFor="phone">
            {t('profile.phone')}
          </label>
          <input
            aria-describedby="phone-hint"
            autoComplete="tel"
            className={SETTINGS_FIELD}
            id="phone"
            maxLength={40}
            onChange={(e) => edited(setPhoneNumber)(e.target.value)}
            type="tel"
            value={phoneNumber}
          />
          <p className="mt-1 text-[12px] text-brand-muted" id="phone-hint">
            {t('profile.phoneHint')}
          </p>
          <label className="mt-3 flex items-center gap-2 text-[14px] text-brand-ink">
            <input
              checked={publicContactAllowed}
              className="size-4 accent-brand-terracotta"
              onChange={(e) => edited(setPublicContactAllowed)(e.target.checked)}
              type="checkbox"
            />
            {t('profile.publicContact')}
          </label>
        </div>
      </section>

      <RoomWantedSection
        citySlug={citySlug}
        locale={locale}
        onChange={edited(setRoomWanted)}
        value={roomWanted}
      />

      <section className={SETTINGS_SECTION}>
        <header>
          <h2 className="text-[17px] font-semibold text-brand-ink">{t('preferences.heading')}</h2>
          <p className="mt-1 text-[13px] text-brand-muted">{t('preferences.description')}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={SETTINGS_LABEL} htmlFor="gender">
              {t('preferences.gender')}
            </label>
            <select
              className={SETTINGS_FIELD}
              id="gender"
              onChange={(e) => edited(setGender)(e.target.value)}
              value={gender}
            >
              <option value="">{t('preferences.any')}</option>
              {GENDERS.map((value) => (
                <option key={value} value={value}>
                  {tEnums(`roommatePreference.${value}`)}
                </option>
              ))}
            </select>
          </div>
          {(
            [
              ['smoking', smoking, setSmoking],
              ['pets', pets, setPets],
            ] as const
          ).map(([key, value, setter]) => (
            <div key={key}>
              <label className={SETTINGS_LABEL} htmlFor={key}>
                {t(`preferences.${key}`)}
              </label>
              <select
                className={SETTINGS_FIELD}
                id={key}
                onChange={(e) => edited(setter)(e.target.value as TriState)}
                value={value}
              >
                <option value="">{t('preferences.any')}</option>
                <option value="true">{t('preferences.yes')}</option>
                <option value="false">{t('preferences.no')}</option>
              </select>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={SETTINGS_LABEL} htmlFor="quietHoursFrom">
              {t('preferences.quietHoursFrom')}
            </label>
            <input
              className={SETTINGS_FIELD}
              id="quietHoursFrom"
              onChange={(e) => edited(setQuietHoursFrom)(e.target.value)}
              type="time"
              value={quietHoursFrom}
            />
          </div>
          <div>
            <label className={SETTINGS_LABEL} htmlFor="ageMin">
              {t('preferences.ageMin')}
            </label>
            <input
              className={SETTINGS_FIELD}
              id="ageMin"
              inputMode="numeric"
              max={120}
              min={16}
              onChange={(e) => edited(setAgeMin)(e.target.value)}
              type="number"
              value={ageMin}
            />
          </div>
          <div>
            <label className={SETTINGS_LABEL} htmlFor="ageMax">
              {t('preferences.ageMax')}
            </label>
            <input
              className={SETTINGS_FIELD}
              id="ageMax"
              inputMode="numeric"
              max={120}
              min={16}
              onChange={(e) => edited(setAgeMax)(e.target.value)}
              type="number"
              value={ageMax}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={SETTINGS_LABEL} htmlFor="occupation">
              {t('preferences.occupation')}
            </label>
            <input
              className={SETTINGS_FIELD}
              id="occupation"
              maxLength={120}
              onChange={(e) => edited(setOccupation)(e.target.value)}
              value={occupation}
            />
          </div>
          <div>
            <label className={SETTINGS_LABEL} htmlFor="environment">
              {t('preferences.environment')}
            </label>
            <input
              className={SETTINGS_FIELD}
              id="environment"
              maxLength={200}
              onChange={(e) => edited(setEnvironment)(e.target.value)}
              value={environment}
            />
          </div>
        </div>
      </section>

      <SettingsSaveBar
        isError={save.isError}
        isPending={save.isPending}
        isSuccess={save.isSuccess}
        labels={{
          save: t('save'),
          saving: t('saving'),
          saved: t('saved'),
          failed: t('saveFailed'),
        }}
      />
    </form>
  );
}
