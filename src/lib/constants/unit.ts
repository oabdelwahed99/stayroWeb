export const UNIT_TYPES = [
  "apartment",
  "villa",
  "chalet",
  "studio",
  "room",
  "farm",
  "camp",
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

export const AMENITIES = [
  "wifi",
  "parking",
  "ac",
  "kitchen",
  "washer",
  "pool",
  "tv",
  "workspace",
  "elevator",
  "gym",
  "garden",
  "bbq",
  "security",
  "pets_allowed",
] as const;

export type Amenity = (typeof AMENITIES)[number];
