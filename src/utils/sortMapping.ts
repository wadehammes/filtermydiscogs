import { SortValues } from "src/context/filters.context";

export interface DiscogsSortParams {
  sort: string;
  sortOrder: "asc" | "desc";
}

/**
 * Maps our internal sort values to Discogs API sort parameters
 */
export const mapSortToDiscogsParams = (
  sortValue: SortValues,
): DiscogsSortParams => {
  switch (sortValue) {
    case SortValues.DateAddedNew:
      return { sort: "added", sortOrder: "desc" };
    case SortValues.DateAddedOld:
      return { sort: "added", sortOrder: "asc" };
    case SortValues.AlbumYearNew:
      return { sort: "year", sortOrder: "desc" };
    case SortValues.AlbumYearOld:
      return { sort: "year", sortOrder: "asc" };
    case SortValues.RatingHigh:
      return { sort: "rating", sortOrder: "desc" };
    case SortValues.RatingLow:
      return { sort: "rating", sortOrder: "asc" };
    case SortValues.AZArtist:
      return { sort: "artist", sortOrder: "asc" };
    case SortValues.ZAArtist:
      return { sort: "artist", sortOrder: "desc" };
    case SortValues.AZTitle:
      return { sort: "title", sortOrder: "asc" };
    case SortValues.ZATitle:
      return { sort: "title", sortOrder: "desc" };
    case SortValues.AZLabel:
      return { sort: "label", sortOrder: "asc" };
    case SortValues.ZALabel:
      return { sort: "label", sortOrder: "desc" };
    default:
      return { sort: "added", sortOrder: "desc" };
  }
};
