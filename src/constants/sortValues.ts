export enum SortValues {
  AZLabel = "AZLabel",
  ZALabel = "ZALabel",
  AZArtist = "AZArtist",
  ZAArtist = "ZAArtist",
  AZTitle = "AZTitle",
  ZATitle = "ZATitle",
  DateAddedNew = "DateAddedNew",
  DateAddedOld = "DateAddedOld",
  RatingHigh = "RatingHigh",
  RatingLow = "RatingLow",
  AlbumYearNew = "AlbumYearNew",
  AlbumYearOld = "AlbumYearOld",
}

export enum SortSecondaryValues {
  None = "None",
}

export type CollectionSortSecondary = SortValues | SortSecondaryValues.None;

export const VALID_SORT_VALUES = new Set<string>(Object.values(SortValues));

export const VALID_SORT_SECONDARY_VALUES = new Set<string>([
  SortSecondaryValues.None,
  ...Object.values(SortValues),
]);
