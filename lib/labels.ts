/**
 * Value lists for the DB enums declared in `db/schema.ts`.
 *
 * The unions are re-declared locally so client bundles never pull in the schema
 * module. Their human labels live in `locales/<locale>/enums.json` and are read with
 * `t(\`propertyType.\${value}\`)`; because the key is a template literal over the union,
 * a renamed enum member is still a compile error at every call site.
 */

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'ROOM';
export type RoommatePreference =
  | 'ANY'
  | 'STUDENTS'
  | 'PROFESSIONALS'
  | 'WOMEN_ONLY'
  | 'MEN_ONLY';
export type ViewingRequestStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export type ReviewerRole = 'TENANT' | 'OWNER';

export const PROPERTY_TYPES: PropertyType[] = [
  'ROOM',
  'APARTMENT',
  'STUDIO',
  'HOUSE',
];

export const ROOMMATE_PREFERENCES: RoommatePreference[] = [
  'ANY',
  'STUDENTS',
  'PROFESSIONALS',
  'WOMEN_ONLY',
  'MEN_ONLY',
];
