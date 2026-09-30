import { sofiaNeighborhoodGroups, sofiaNeighborhoods } from "./sofia";
import { plovdivNeighborhoodGroups, plovdivNeighborhoods } from "./plovdiv";

import type { Locale } from "./locales";
import type { LocalizedString, Neighborhood } from "./sofia";

export type {
  LocalizedString,
  NeighborhoodGroupId,
  NeighborhoodGroup,
  Neighborhood,
} from "./sofia";

export type CityId = "sofia" | "plovdiv";

export const neighborhoodGroupsByCity = {
  sofia: sofiaNeighborhoodGroups,
  plovdiv: plovdivNeighborhoodGroups,
};

export const neighborhoodsByCity = {
  sofia: sofiaNeighborhoods,
  plovdiv: plovdivNeighborhoods,
};

export const CITY_IDS: CityId[] = ["sofia", "plovdiv"];

export const cityLabels: Record<CityId, LocalizedString> = {
  sofia: { en: "Sofia", bg: "София" },
  plovdiv: { en: "Plovdiv", bg: "Пловдив" },
};

export function getNeighborhoodGroupsByCity(cityId: CityId) {
  return neighborhoodGroupsByCity[cityId];
}

export function getNeighborhoodsByCity(cityId: CityId) {
  return neighborhoodsByCity[cityId];
}

export function isCityId(value: string | null | undefined): value is CityId {
  return value === "sofia" || value === "plovdiv";
}

/**
 * Slug → neighborhood lookups happen on every listing card, so the linear
 * arrays are indexed once at module load rather than scanned per render.
 */
const neighborhoodIndex: Record<CityId, Map<string, Neighborhood>> = {
  sofia: new Map(sofiaNeighborhoods.map((item) => [item.id, item])),
  plovdiv: new Map(plovdivNeighborhoods.map((item) => [item.id, item])),
};

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

  return neighborhoodIndex[cityId].get(neighborhoodId)?.label[locale] ?? neighborhoodId;
}

/** The neighbourhood record (label, group), or `undefined` for a slug the city lacks. */
export function getNeighborhood(cityId: CityId, neighborhoodId: string) {
  return neighborhoodIndex[cityId].get(neighborhoodId);
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
  return neighborhoodIndex[cityId].has(neighborhoodId);
}

/** Neighborhoods grouped for the filter sidebar, in the order groups are declared. */
export function getGroupedNeighborhoods(cityId: CityId) {
  const groups = neighborhoodGroupsByCity[cityId];
  const neighborhoods = neighborhoodsByCity[cityId];

  return groups.map((group) => ({
    group,
    neighborhoods: neighborhoods.filter((item) => item.groupId === group.id),
  }));
}
