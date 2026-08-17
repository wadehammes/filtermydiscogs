import type {
  DiscogsArtist,
  DiscogsBasicInformation,
  DiscogsRelease,
} from "src/types";

interface GetSimilarReleasesParams {
  releases: DiscogsRelease[];
  sourceRelease: DiscogsRelease;
  limit?: number;
}

const STYLE_WEIGHT = 0.65;
const GENRE_WEIGHT = 0.35;
const SHARED_ARTIST_PENALTY = 0.2;
const SHARED_LABEL_BOOST = 0.05;
const YEAR_PROXIMITY_MAX_BOOST = 0.1;
const YEAR_PROXIMITY_WINDOW = 5;

const normalizeTag = (value: string): string => value.trim().toLowerCase();

const normalizeTagSet = (values: string[] | undefined): Set<string> => {
  const tags = new Set<string>();

  values?.forEach((value) => {
    const normalized = normalizeTag(value);

    if (normalized) {
      tags.add(normalized);
    }
  });

  return tags;
};

const jaccardSimilarity = (left: Set<string>, right: Set<string>): number => {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let overlap = 0;

  for (const tag of left) {
    if (right.has(tag)) {
      overlap += 1;
    }
  }

  if (overlap === 0) {
    return 0;
  }

  const union = new Set([...left, ...right]).size;

  return overlap / union;
};

const getArtistNameSet = (
  artists: DiscogsArtist[] | undefined,
): Set<string> => {
  const names = new Set<string>();

  artists?.forEach((artist) => {
    const normalized = normalizeTag(artist.anv?.trim() || artist.name);

    if (normalized) {
      names.add(normalized);
    }
  });

  return names;
};

const getLabelNameSet = (
  labels: DiscogsBasicInformation["labels"] | undefined,
): Set<string> => {
  const names = new Set<string>();

  labels?.forEach((label) => {
    const normalized = normalizeTag(label.name);

    if (normalized) {
      names.add(normalized);
    }
  });

  return names;
};

const hasSharedValue = (left: Set<string>, right: Set<string>): boolean => {
  for (const value of left) {
    if (right.has(value)) {
      return true;
    }
  }

  return false;
};

const getWeightedTagScore = ({
  sourceGenres,
  sourceStyles,
  candidateGenres,
  candidateStyles,
}: {
  sourceGenres: Set<string>;
  sourceStyles: Set<string>;
  candidateGenres: Set<string>;
  candidateStyles: Set<string>;
}): number => {
  const styleScore = jaccardSimilarity(sourceStyles, candidateStyles);
  const genreScore = jaccardSimilarity(sourceGenres, candidateGenres);

  if (sourceStyles.size > 0 && sourceGenres.size > 0) {
    return styleScore * STYLE_WEIGHT + genreScore * GENRE_WEIGHT;
  }

  if (sourceStyles.size > 0) {
    return styleScore;
  }

  if (sourceGenres.size > 0) {
    return genreScore;
  }

  return 0;
};

const getYearProximityBoost = (
  sourceYear: number,
  candidateYear: number,
): number => {
  if (!(sourceYear && candidateYear)) {
    return 0;
  }

  const yearDistance = Math.abs(sourceYear - candidateYear);

  if (yearDistance > YEAR_PROXIMITY_WINDOW) {
    return 0;
  }

  return (
    ((YEAR_PROXIMITY_WINDOW - yearDistance) / YEAR_PROXIMITY_WINDOW) *
    YEAR_PROXIMITY_MAX_BOOST
  );
};

const scoreSimilarRelease = ({
  sourceRelease,
  candidateRelease,
}: {
  sourceRelease: DiscogsRelease;
  candidateRelease: DiscogsRelease;
}): number | null => {
  const sourceInfo = sourceRelease.basic_information;
  const candidateInfo = candidateRelease.basic_information;
  const sourceGenres = normalizeTagSet(sourceInfo.genres);
  const sourceStyles = normalizeTagSet(sourceInfo.styles);
  const candidateGenres = normalizeTagSet(candidateInfo.genres);
  const candidateStyles = normalizeTagSet(candidateInfo.styles);
  const sourceArtists = getArtistNameSet(sourceInfo.artists);
  const candidateArtists = getArtistNameSet(candidateInfo.artists);
  const sourceLabels = getLabelNameSet(sourceInfo.labels);
  const candidateLabels = getLabelNameSet(candidateInfo.labels);
  const sharedArtist = hasSharedValue(sourceArtists, candidateArtists);
  const hasSourceTags = sourceGenres.size > 0 || sourceStyles.size > 0;
  const tagScore = getWeightedTagScore({
    sourceGenres,
    sourceStyles,
    candidateGenres,
    candidateStyles,
  });

  if (!hasSourceTags || tagScore === 0) {
    return null;
  }

  let score = tagScore;

  if (sharedArtist) {
    score -= SHARED_ARTIST_PENALTY;
  }

  if (hasSharedValue(sourceLabels, candidateLabels)) {
    score += SHARED_LABEL_BOOST;
  }

  score += getYearProximityBoost(sourceInfo.year, candidateInfo.year);

  return score;
};

export const getSimilarReleases = ({
  releases,
  sourceRelease,
  limit = 8,
}: GetSimilarReleasesParams): DiscogsRelease[] => {
  const sourceMasterId = sourceRelease.basic_information.master_id;
  const sourceInstanceId = sourceRelease.instance_id;

  const scored: Array<{ release: DiscogsRelease; score: number }> = [];

  for (const release of releases) {
    if (release.instance_id === sourceInstanceId) {
      continue;
    }

    if (
      sourceMasterId &&
      release.basic_information.master_id === sourceMasterId
    ) {
      continue;
    }

    const score = scoreSimilarRelease({
      sourceRelease,
      candidateRelease: release,
    });

    if (score === null) {
      continue;
    }

    scored.push({ release, score });
  }

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.release.basic_information.title.localeCompare(
      right.release.basic_information.title,
    );
  });

  return scored.slice(0, limit).map(({ release }) => release);
};
