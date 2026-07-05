import { sofiaNeighborhoodGroups, sofiaNeighborhoods } from "./sofia";
import { plovdivNeighborhoodGroups, plovdivNeighborhoods } from "./plovdiv";

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

export function getNeighborhoodGroupsByCity(cityId: CityId) {
  return neighborhoodGroupsByCity[cityId];
}

export function getNeighborhoodsByCity(cityId: CityId) {
  return neighborhoodsByCity[cityId];
}
