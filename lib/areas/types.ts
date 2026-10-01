// Shared types for neighborhood area data.

import type { Locale } from "./locales";

export type LocalizedString = Record<Locale, string>;

export type CityId =
  | "sofia"
  | "plovdiv"
  | "varna"
  | "burgas"
  | "ruse"
  | "stara-zagora"
  | "veliko-tarnovo"
  | "blagoevgrad"
  | "pleven"
  | "haskovo";

export type NeighborhoodGroupId =
  | "center"
  | "south"
  | "east"
  | "west"
  | "north"
  | "south-belt";

export type NeighborhoodGroup = {
  id: NeighborhoodGroupId;
  label: LocalizedString;
};

export type Neighborhood = {
  id: string;
  groupId: NeighborhoodGroupId;
  label: LocalizedString;
};

export type CityNeighborhoodData = {
  cityId: CityId;
  groups: NeighborhoodGroup[];
  neighborhoods: Neighborhood[];
};
