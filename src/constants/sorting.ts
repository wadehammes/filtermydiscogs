import { SortValues } from "src/context/filters.context";

export const SORTING_OPTIONS = [
  { name: "Date Added (New to Old)", value: SortValues.DateAddedNew },
  { name: "Date Added (Old to New)", value: SortValues.DateAddedOld },
  { name: "Release Year (New to Old)", value: SortValues.AlbumYearNew },
  { name: "Release Year (Old to New)", value: SortValues.AlbumYearOld },
  { name: "Rating (High to Low)", value: SortValues.RatingHigh },
  { name: "Rating (Low to High)", value: SortValues.RatingLow },
  { name: "Artist (A-Z)", value: SortValues.AZArtist },
  { name: "Artist (Z-A)", value: SortValues.ZAArtist },
  { name: "Title (A-Z)", value: SortValues.AZTitle },
  { name: "Title (Z-A)", value: SortValues.ZATitle },
  { name: "Label (A-Z)", value: SortValues.AZLabel },
  { name: "Label (Z-A)", value: SortValues.ZALabel },
] as const;

export const SORTING_CATEGORIES = {
  alphabetical: [
    { name: "Artist (A-Z)", value: SortValues.AZArtist },
    { name: "Artist (Z-A)", value: SortValues.ZAArtist },
    { name: "Title (A-Z)", value: SortValues.AZTitle },
    { name: "Title (Z-A)", value: SortValues.ZATitle },
    { name: "Label (A-Z)", value: SortValues.AZLabel },
    { name: "Label (Z-A)", value: SortValues.ZALabel },
  ],
  chronological: [
    { name: "Date Added (New to Old)", value: SortValues.DateAddedNew },
    { name: "Date Added (Old to New)", value: SortValues.DateAddedOld },
    { name: "Release Year (New to Old)", value: SortValues.AlbumYearNew },
    { name: "Release Year (Old to New)", value: SortValues.AlbumYearOld },
  ],
  rating: [
    { name: "Rating (High to Low)", value: SortValues.RatingHigh },
    { name: "Rating (Low to High)", value: SortValues.RatingLow },
  ],
} as const;
