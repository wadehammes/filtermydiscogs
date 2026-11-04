import {
  type CollectionSortSecondary,
  SortSecondaryValues,
  SortValues,
} from "src/constants/sortValues";

export type SortMenuGroup =
  | "dateAdded"
  | "releaseYear"
  | "rating"
  | "artist"
  | "title"
  | "label";

export type SortOption = {
  name: string;
  menuField: string;
  menuOrder?: string;
  shortName: string;
  menuGroup: SortMenuGroup;
  value: SortValues;
};

export const formatSortMenuAccessibleLabel = (
  menuField: string,
  menuOrder?: string,
): string => (menuOrder ? `${menuField} ${menuOrder}` : menuField);

export const SORTING_OPTIONS = [
  {
    name: "Date Added · newest",
    menuField: "Date Added",
    menuOrder: "newest",
    shortName: "Date Added ↓",
    menuGroup: "dateAdded",
    value: SortValues.DateAddedNew,
  },
  {
    name: "Date Added · oldest",
    menuField: "Date Added",
    menuOrder: "oldest",
    shortName: "Date Added ↑",
    menuGroup: "dateAdded",
    value: SortValues.DateAddedOld,
  },
  {
    name: "Release Year · newest",
    menuField: "Release Year",
    menuOrder: "newest",
    shortName: "Release Year ↓",
    menuGroup: "releaseYear",
    value: SortValues.AlbumYearNew,
  },
  {
    name: "Release Year · oldest",
    menuField: "Release Year",
    menuOrder: "oldest",
    shortName: "Release Year ↑",
    menuGroup: "releaseYear",
    value: SortValues.AlbumYearOld,
  },
  {
    name: "Rating · high to low",
    menuField: "Rating",
    menuOrder: "high to low",
    shortName: "Rating ↓",
    menuGroup: "rating",
    value: SortValues.RatingHigh,
  },
  {
    name: "Rating · low to high",
    menuField: "Rating",
    menuOrder: "low to high",
    shortName: "Rating ↑",
    menuGroup: "rating",
    value: SortValues.RatingLow,
  },
  {
    name: "Artist A–Z",
    menuField: "Artist",
    menuOrder: "A–Z",
    shortName: "Artist A–Z",
    menuGroup: "artist",
    value: SortValues.AZArtist,
  },
  {
    name: "Artist Z–A",
    menuField: "Artist",
    menuOrder: "Z–A",
    shortName: "Artist Z–A",
    menuGroup: "artist",
    value: SortValues.ZAArtist,
  },
  {
    name: "Title A–Z",
    menuField: "Title",
    menuOrder: "A–Z",
    shortName: "Title A–Z",
    menuGroup: "title",
    value: SortValues.AZTitle,
  },
  {
    name: "Title Z–A",
    menuField: "Title",
    menuOrder: "Z–A",
    shortName: "Title Z–A",
    menuGroup: "title",
    value: SortValues.ZATitle,
  },
  {
    name: "Label A–Z",
    menuField: "Label",
    menuOrder: "A–Z",
    shortName: "Label A–Z",
    menuGroup: "label",
    value: SortValues.AZLabel,
  },
  {
    name: "Label Z–A",
    menuField: "Label",
    menuOrder: "Z–A",
    shortName: "Label Z–A",
    menuGroup: "label",
    value: SortValues.ZALabel,
  },
] as const satisfies readonly SortOption[];

export const SORTING_SECONDARY_OPTIONS = [
  {
    name: "None",
    menuField: "None",
    shortName: "None",
    value: SortSecondaryValues.None,
  },
  ...SORTING_OPTIONS,
] as const;

export const findSortOptionByValue = (value: SortValues) =>
  SORTING_OPTIONS.find((option) => option.value === value);

export const isThenByCompatibleWithPrimary = (
  primarySort: SortValues,
  secondarySort: string,
): boolean => {
  if (secondarySort === SortSecondaryValues.None) {
    return true;
  }

  if (secondarySort === primarySort) {
    return false;
  }

  const primaryOption = findSortOptionByValue(primarySort);
  const secondaryOption = findSortOptionByValue(secondarySort as SortValues);

  if (
    primaryOption !== undefined &&
    secondaryOption !== undefined &&
    primaryOption.menuGroup === secondaryOption.menuGroup
  ) {
    return false;
  }

  return true;
};

export const normalizeThenBySortSelection = (
  primarySort: SortValues,
  secondarySort: string,
): CollectionSortSecondary => {
  if (!isThenByCompatibleWithPrimary(primarySort, secondarySort)) {
    return SortSecondaryValues.None;
  }

  return secondarySort as CollectionSortSecondary;
};
