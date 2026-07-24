import { SortValues } from "src/context/filters.context";
import type { DiscogsRelease } from "src/types";

const compareNumeric = (a: number, b: number, descending: boolean) =>
  descending ? b - a : a - b;

// Natural sort comparison - handles numeric prefixes correctly
// Useful for titles, artists, labels, etc. that may start with numbers
const compareNatural = ({
  a,
  b,
  descending,
}: {
  a: string;
  b: string;
  descending: boolean;
}) => {
  // Trim and normalize
  const strA = a.trim();
  const strB = b.trim();

  // Extract leading numbers from both strings
  const numMatchA = strA.match(/^(\d+)/);
  const numMatchB = strB.match(/^(\d+)/);

  // If both start with numbers, compare numerically
  if (numMatchA && numMatchB && numMatchA[1] && numMatchB[1]) {
    const numA = parseInt(numMatchA[1], 10);
    const numB = parseInt(numMatchB[1], 10);
    if (numA !== numB) {
      return descending ? numB - numA : numA - numB;
    }
    // If numbers are equal, compare the rest of the string
    const restA = strA.slice(numMatchA[1].length);
    const restB = strB.slice(numMatchB[1].length);
    return descending ? restB.localeCompare(restA) : restA.localeCompare(restB);
  }

  // If only one starts with a number, numbers come first (or last if descending)
  if (numMatchA && !numMatchB) {
    return descending ? 1 : -1;
  }
  if (!numMatchA && numMatchB) {
    return descending ? -1 : 1;
  }

  // Neither starts with a number, use regular string comparison
  return descending ? strB.localeCompare(strA) : strA.localeCompare(strB);
};

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
        compareNatural({
          a: getArtist(a),
          b: getArtist(b),
          descending: false,
        }),
      );

    case SortValues.ZAArtist:
      return sorted.sort((a, b) =>
        compareNatural({
          a: getArtist(a),
          b: getArtist(b),
          descending: true,
        }),
      );

    case SortValues.AZTitle:
      return sorted.sort((a, b) =>
        compareNatural({
          a: getTitle(a),
          b: getTitle(b),
          descending: false,
        }),
      );

    case SortValues.ZATitle:
      return sorted.sort((a, b) =>
        compareNatural({
          a: getTitle(a),
          b: getTitle(b),
          descending: true,
        }),
      );

    case SortValues.AZLabel:
      return sorted.sort((a, b) =>
        compareNatural({
          a: getLabel(a),
          b: getLabel(b),
          descending: false,
        }),
      );

    case SortValues.ZALabel:
      return sorted.sort((a, b) =>
        compareNatural({
          a: getLabel(a),
          b: getLabel(b),
          descending: true,
        }),
      );

    default:
      return sorted.sort((a, b) =>
        compareNumeric(getDateAdded(a), getDateAdded(b), true),
      );
  }
};
