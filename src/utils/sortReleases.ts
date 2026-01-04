import { SortValues } from "src/context/filters.context";
import type { DiscogsRelease } from "src/types";

const compareNumeric = (a: number, b: number, descending: boolean) =>
  descending ? b - a : a - b;

const compareString = (a: string, b: string, descending: boolean) =>
  descending ? b.localeCompare(a) : a.localeCompare(b);

const getDateAdded = (release: DiscogsRelease) =>
  new Date(release.date_added).getTime();

const getYear = (release: DiscogsRelease) =>
  release.basic_information.year || 0;

const getRating = (release: DiscogsRelease) => release.rating || 0;

const getArtist = (release: DiscogsRelease) =>
  release.basic_information.artists[0]?.name?.toLowerCase() || "";

const getTitle = (release: DiscogsRelease) =>
  release.basic_information.title?.toLowerCase() || "";

const getLabel = (release: DiscogsRelease) =>
  release.basic_information.labels[0]?.name?.toLowerCase() || "";

export const sortReleases = (
  releases: DiscogsRelease[],
  sort: SortValues,
): DiscogsRelease[] => {
  const sorted = [...releases];

  switch (sort) {
    case SortValues.DateAddedNew:
      return sorted.sort((a, b) =>
        compareNumeric(getDateAdded(a), getDateAdded(b), true),
      );

    case SortValues.DateAddedOld:
      return sorted.sort((a, b) =>
        compareNumeric(getDateAdded(a), getDateAdded(b), false),
      );

    case SortValues.AlbumYearNew:
      return sorted.sort((a, b) =>
        compareNumeric(getYear(a), getYear(b), true),
      );

    case SortValues.AlbumYearOld:
      return sorted.sort((a, b) =>
        compareNumeric(getYear(a), getYear(b), false),
      );

    case SortValues.RatingHigh:
      return sorted.sort((a, b) =>
        compareNumeric(getRating(a), getRating(b), true),
      );

    case SortValues.RatingLow:
      return sorted.sort((a, b) =>
        compareNumeric(getRating(a), getRating(b), false),
      );

    case SortValues.AZArtist:
      return sorted.sort((a, b) =>
        compareString(getArtist(a), getArtist(b), false),
      );

    case SortValues.ZAArtist:
      return sorted.sort((a, b) =>
        compareString(getArtist(a), getArtist(b), true),
      );

    case SortValues.AZTitle:
      return sorted.sort((a, b) =>
        compareString(getTitle(a), getTitle(b), false),
      );

    case SortValues.ZATitle:
      return sorted.sort((a, b) =>
        compareString(getTitle(a), getTitle(b), true),
      );

    case SortValues.AZLabel:
      return sorted.sort((a, b) =>
        compareString(getLabel(a), getLabel(b), false),
      );

    case SortValues.ZALabel:
      return sorted.sort((a, b) =>
        compareString(getLabel(a), getLabel(b), true),
      );

    default:
      return sorted.sort((a, b) =>
        compareNumeric(getDateAdded(a), getDateAdded(b), true),
      );
  }
};
