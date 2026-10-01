import { sofiaNeighborhoodGroups, sofiaNeighborhoods } from "./sofia";
import { plovdivNeighborhoodGroups, plovdivNeighborhoods } from "./plovdiv";

import type { Locale } from "./locales";
import type { CityId, LocalizedString, Neighborhood, NeighborhoodGroup } from "./types";

export { AREA_KINDS, AREA_KIND_FILTERS, AREA_KIND_SEGMENTS, type AreaKind } from "./kinds";

export type {
  CityId,
  LocalizedString,
  NeighborhoodGroupId,
  NeighborhoodGroup,
  Neighborhood,
} from "./types";

/** The order pickers, filters and the footer show: largest cities first, then university towns. */
export const CITY_IDS: CityId[] = [
  "sofia",
  "plovdiv",
  "varna",
  "burgas",
  "ruse",
  "stara-zagora",
  "veliko-tarnovo",
  "blagoevgrad",
  "pleven",
  "haskovo",
];

export const cityLabels: Record<CityId, LocalizedString> = {
  sofia: { en: "Sofia", bg: "София" },
  plovdiv: { en: "Plovdiv", bg: "Пловдив" },
  varna: { en: "Varna", bg: "Варна" },
  burgas: { en: "Burgas", bg: "Бургас" },
  ruse: { en: "Ruse", bg: "Русе" },
  "stara-zagora": { en: "Stara Zagora", bg: "Стара Загора" },
  "veliko-tarnovo": { en: "Veliko Tarnovo", bg: "Велико Търново" },
  blagoevgrad: { en: "Blagoevgrad", bg: "Благоевград" },
  pleven: { en: "Pleven", bg: "Плевен" },
  haskovo: { en: "Haskovo", bg: "Хасково" },
};

/**
 * Only some cities have neighbourhood data so far. The rest still take listings and
 * searches, just without a neighbourhood level (pickers and filters hide it).
 */
const neighborhoodDataByCity: Partial<
  Record<CityId, { groups: NeighborhoodGroup[]; neighborhoods: Neighborhood[] }>
> = {
  sofia: { groups: sofiaNeighborhoodGroups, neighborhoods: sofiaNeighborhoods },
  plovdiv: { groups: plovdivNeighborhoodGroups, neighborhoods: plovdivNeighborhoods },
};

export function getNeighborhoodGroupsByCity(cityId: CityId): NeighborhoodGroup[] {
  return neighborhoodDataByCity[cityId]?.groups ?? [];
}

export function getNeighborhoodsByCity(cityId: CityId): Neighborhood[] {
  return neighborhoodDataByCity[cityId]?.neighborhoods ?? [];
}

const cityIdSet: ReadonlySet<string> = new Set(CITY_IDS);

export function isCityId(value: string | null | undefined): value is CityId {
  return value != null && cityIdSet.has(value);
}

/** Only Sofia has a metro, so "near the metro" is only offered there. */
const metroCities: ReadonlySet<string> = new Set<CityId>(["sofia"]);

export function hasMetro(cityId: string | null | undefined) {
  return cityId != null && metroCities.has(cityId);
}

/**
 * Slug → neighborhood lookups happen on every listing card, so the linear
 * arrays are indexed once at module load rather than scanned per render.
 */
const neighborhoodIndex = new Map<CityId, Map<string, Neighborhood>>(
  CITY_IDS.map((cityId) => [
    cityId,
    new Map(getNeighborhoodsByCity(cityId).map((item) => [item.id, item])),
  ]),
);

export function getCityLabel(cityId: string | null | undefined, locale: Locale) {
  return isCityId(cityId) ? cityLabels[cityId][locale] : (cityId ?? "");
}

/** Falls back to the raw slug so unknown data still renders something readable. */
export function getNeighborhoodLabel(
  cityId: string | null | undefined,
  neighborhoodId: string | null | undefined,
  locale: Locale,
) {
  if (!neighborhoodId) {
    return null;
  }

  if (!isCityId(cityId)) {
    return neighborhoodId;
  }

  return getNeighborhood(cityId, neighborhoodId)?.label[locale] ?? neighborhoodId;
}

/** The neighbourhood record (label, group), or `undefined` for a slug the city lacks. */
export function getNeighborhood(cityId: CityId, neighborhoodId: string) {
  return neighborhoodIndex.get(cityId)?.get(neighborhoodId);
}

/**
 * "in Lozenets, Sofia" / "в Лозенец, София". Grammar rather than copy, so it lives here:
 * Bulgarian writes "във" before a word starting with "в" or "ф".
 */
export function inPlace(locale: Locale, place: string) {
  if (locale === "bg") {
    return `${/^[вф]/i.test(place) ? "във" : "в"} ${place}`;
  }

  return `in ${place}`;
}

/** Whether `neighborhoodId` is one of `cityId`'s neighbourhoods. */
export function isNeighborhoodInCity(cityId: CityId, neighborhoodId: string) {
  return getNeighborhood(cityId, neighborhoodId) !== undefined;
}

/** Neighborhoods grouped for the filter sidebar, in the order groups are declared. */
export function getGroupedNeighborhoods(cityId: CityId) {
  const neighborhoods = getNeighborhoodsByCity(cityId);

  return getNeighborhoodGroupsByCity(cityId).map((group) => ({
    group,
    neighborhoods: neighborhoods.filter((item) => item.groupId === group.id),
  }));
}
