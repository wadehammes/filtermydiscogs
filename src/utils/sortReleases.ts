import { isThenByCompatibleWithPrimary } from "src/constants/sorting";
import {
  type CollectionSortSecondary,
  SortSecondaryValues,
  SortValues,
} from "src/constants/sortValues";
import type { DiscogsRelease } from "src/types";

const compareNumeric = (a: number, b: number, descending: boolean) =>
  descending ? b - a : a - b;

const compareNatural = ({
  a,
  b,
  descending,
}: {
  a: string;
  b: string;
  descending: boolean;
}) => {
  const strA = a.trim();
  const strB = b.trim();

  const numMatchA = strA.match(/^(\d+)/);
  const numMatchB = strB.match(/^(\d+)/);

  if (numMatchA && numMatchB && numMatchA[1] && numMatchB[1]) {
    const numA = parseInt(numMatchA[1], 10);
    const numB = parseInt(numMatchB[1], 10);
    if (numA !== numB) {
      return descending ? numB - numA : numA - numB;
    }
    const restA = strA.slice(numMatchA[1].length);
    const restB = strB.slice(numMatchB[1].length);
    return descending ? restB.localeCompare(restA) : restA.localeCompare(restB);
  }

  if (numMatchA && !numMatchB) {
    return descending ? 1 : -1;
  }
  if (!numMatchA && numMatchB) {
    return descending ? -1 : 1;
  }

  return descending ? strB.localeCompare(strA) : strA.localeCompare(strB);
};

const getDateAdded = (release: DiscogsRelease) =>
  new Date(release.date_added).getTime();

const getDateAddedUtcDayStart = (release: DiscogsRelease) => {
  const date = new Date(release.date_added);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const isDateAddedSort = (sort: SortValues): boolean =>
  sort === SortValues.DateAddedNew || sort === SortValues.DateAddedOld;

type CompareReleasesBySortOptions = {
  dateAddedGranularity?: "instant" | "utcDay";
};

const getYear = (release: DiscogsRelease) =>
  release.basic_information.year || 0;

const getRating = (release: DiscogsRelease) => release.rating || 0;

const getArtist = (release: DiscogsRelease) =>
  release.basic_information.artists[0]?.name?.toLowerCase() || "";

const getTitle = (release: DiscogsRelease) =>
  release.basic_information.title?.toLowerCase() || "";

const getLabel = (release: DiscogsRelease) =>
  release.basic_information.labels[0]?.name?.toLowerCase() || "";

export const compareReleasesBySort = (
  a: DiscogsRelease,
  b: DiscogsRelease,
  sort: SortValues,
  options?: CompareReleasesBySortOptions,
): number => {
  switch (sort) {
    case SortValues.DateAddedNew: {
      if (options?.dateAddedGranularity === "utcDay") {
        const dayCompare = compareNumeric(
          getDateAddedUtcDayStart(a),
          getDateAddedUtcDayStart(b),
          true,
        );
        if (dayCompare !== 0) {
          return dayCompare;
        }

        return 0;
      }

      return compareNumeric(getDateAdded(a), getDateAdded(b), true);
    }

    case SortValues.DateAddedOld: {
      if (options?.dateAddedGranularity === "utcDay") {
        const dayCompare = compareNumeric(
          getDateAddedUtcDayStart(a),
          getDateAddedUtcDayStart(b),
          false,
        );
        if (dayCompare !== 0) {
          return dayCompare;
        }

        return 0;
      }

      return compareNumeric(getDateAdded(a), getDateAdded(b), false);
    }

    case SortValues.AlbumYearNew:
      return compareNumeric(getYear(a), getYear(b), true);

    case SortValues.AlbumYearOld:
      return compareNumeric(getYear(a), getYear(b), false);

    case SortValues.RatingHigh:
      return compareNumeric(getRating(a), getRating(b), true);

    case SortValues.RatingLow:
      return compareNumeric(getRating(a), getRating(b), false);

    case SortValues.AZArtist:
      return compareNatural({
        a: getArtist(a),
        b: getArtist(b),
        descending: false,
      });

    case SortValues.ZAArtist:
      return compareNatural({
        a: getArtist(a),
        b: getArtist(b),
        descending: true,
      });

    case SortValues.AZTitle:
      return compareNatural({
        a: getTitle(a),
        b: getTitle(b),
        descending: false,
      });

    case SortValues.ZATitle:
      return compareNatural({
        a: getTitle(a),
        b: getTitle(b),
        descending: true,
      });

    case SortValues.AZLabel:
      return compareNatural({
        a: getLabel(a),
        b: getLabel(b),
        descending: false,
      });

    case SortValues.ZALabel:
      return compareNatural({
        a: getLabel(a),
        b: getLabel(b),
        descending: true,
      });

    default:
      return compareNumeric(getDateAdded(a), getDateAdded(b), true);
  }
};

export const sortReleases = (
  releases: DiscogsRelease[],
  primarySort: SortValues,
  secondarySort: CollectionSortSecondary = SortSecondaryValues.None,
): DiscogsRelease[] => {
  const sorted = [...releases];
  const activeSecondary =
    secondarySort !== SortSecondaryValues.None &&
    isThenByCompatibleWithPrimary(primarySort, secondarySort)
      ? secondarySort
      : null;

  if (!activeSecondary) {
    return sorted.sort((a, b) => compareReleasesBySort(a, b, primarySort));
  }

  const dateAddedPrimaryUsesUtcDay = isDateAddedSort(primarySort);

  return sorted.sort((a, b) => {
    const primaryCompare = compareReleasesBySort(a, b, primarySort, {
      dateAddedGranularity: dateAddedPrimaryUsesUtcDay ? "utcDay" : "instant",
    });
    if (primaryCompare !== 0) {
      return primaryCompare;
    }

    const secondaryCompare = compareReleasesBySort(a, b, activeSecondary);
    if (secondaryCompare !== 0) {
      return secondaryCompare;
    }

    if (dateAddedPrimaryUsesUtcDay) {
      return compareReleasesBySort(a, b, primarySort, {
        dateAddedGranularity: "instant",
      });
    }

    return 0;
  });
};
