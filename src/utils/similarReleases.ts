import type {
  DiscogsArtist,
  DiscogsBasicInformation,
  DiscogsRelease,
} from "src/types";
import { parseReleaseId } from "src/utils/releaseNotes";

interface GetSimilarReleasesParams {
  releases: DiscogsRelease[];
  sourceRelease: DiscogsRelease;
  limit?: number;
  excludeInstanceIds?: ReadonlySet<string>;
}

const STYLE_WEIGHT = 0.65;
const GENRE_WEIGHT = 0.35;
const SHARED_ARTIST_PENALTY = 0.2;
const SHARED_LABEL_BOOST = 0.05;
const YEAR_PROXIMITY_MAX_BOOST = 0.1;
const YEAR_PROXIMITY_WINDOW = 5;

const normalizeTag = (value: string): string => value.trim().toLowerCase();

const MIN_COMPOUND_TAG_TOKEN_LENGTH = 3;
const COMPOUND_TAG_TOKEN_SPLIT = /[^a-z0-9]+/;

const expandTagTokens = (value: string): string[] => {
  const normalized = normalizeTag(value);

  if (!normalized) {
    return [];
  }

  const tokens = new Set<string>([normalized]);

  for (const segment of normalized.split(COMPOUND_TAG_TOKEN_SPLIT)) {
    const token = segment.trim();

    if (token.length >= MIN_COMPOUND_TAG_TOKEN_LENGTH) {
      tokens.add(token);
    }
  }

  return [...tokens];
};

const normalizeTagSet = (values: string[] | undefined): Set<string> => {
  const tags = new Set<string>();

  values?.forEach((value) => {
    for (const token of expandTagTokens(value)) {
      tags.add(token);
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

const getArtistMatchKeys = (artist: DiscogsArtist): string[] => {
  const keys: string[] = [];

  if (typeof artist.id === "number" && artist.id > 0) {
    keys.push(`id:${artist.id}`);
  }

  const normalizedName = normalizeTag(artist.anv?.trim() || artist.name);

  if (normalizedName) {
    keys.push(`name:${normalizedName}`);
  }

  return keys;
};

const getLabelMatchKeys = (
  label: DiscogsBasicInformation["labels"][number],
): string[] => {
  const keys: string[] = [];

  if (typeof label.id === "number" && label.id > 0) {
    keys.push(`id:${label.id}`);
  }

  const normalizedName = normalizeTag(label.name);

  if (normalizedName) {
    keys.push(`name:${normalizedName}`);
  }

  return keys;
};

const hasSharedArtist = (
  sourceArtists: DiscogsArtist[] | undefined,
  candidateArtists: DiscogsArtist[] | undefined,
): boolean => {
  const sourceKeys = new Set<string>();

  sourceArtists?.forEach((artist) => {
    for (const key of getArtistMatchKeys(artist)) {
      sourceKeys.add(key);
    }
  });

  for (const artist of candidateArtists ?? []) {
    for (const key of getArtistMatchKeys(artist)) {
      if (sourceKeys.has(key)) {
        return true;
      }
    }
  }

  return false;
};

const hasSharedLabel = (
  sourceLabels: DiscogsBasicInformation["labels"] | undefined,
  candidateLabels: DiscogsBasicInformation["labels"] | undefined,
): boolean => {
  const sourceKeys = new Set<string>();

  sourceLabels?.forEach((label) => {
    for (const key of getLabelMatchKeys(label)) {
      sourceKeys.add(key);
    }
  });

  for (const label of candidateLabels ?? []) {
    for (const key of getLabelMatchKeys(label)) {
      if (sourceKeys.has(key)) {
        return true;
      }
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
  const sharedArtist = hasSharedArtist(
    sourceInfo.artists,
    candidateInfo.artists,
  );
  const hasSourceTags = sourceGenres.size > 0 || sourceStyles.size > 0;
  const styleScore = jaccardSimilarity(sourceStyles, candidateStyles);

  if (sourceStyles.size > 0 && styleScore === 0) {
    return null;
  }

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

  if (hasSharedLabel(sourceInfo.labels, candidateInfo.labels)) {
    score += SHARED_LABEL_BOOST;
  }

  score += getYearProximityBoost(sourceInfo.year, candidateInfo.year);

  return score;
};

const dedupeSimilarResults = (
  scored: Array<{ release: DiscogsRelease; score: number }>,
  limit: number,
): DiscogsRelease[] => {
  const seenInstanceIds = new Set<string>();
  const seenReleaseIds = new Set<number>();
  const seenMasterIds = new Set<number>();
  const results: DiscogsRelease[] = [];

  for (const { release } of scored) {
    if (seenInstanceIds.has(release.instance_id)) {
      continue;
    }

    const releaseId = parseReleaseId(release);
    if (releaseId && seenReleaseIds.has(releaseId)) {
      continue;
    }

    const masterId = release.basic_information.master_id;
    if (masterId && seenMasterIds.has(masterId)) {
      continue;
    }

    seenInstanceIds.add(release.instance_id);
    if (releaseId) {
      seenReleaseIds.add(releaseId);
    }
    if (masterId) {
      seenMasterIds.add(masterId);
    }
    results.push(release);

    if (results.length >= limit) {
      break;
    }
  }

  return results;
};

export const getSimilarReleases = ({
  releases,
  sourceRelease,
  limit = 8,
  excludeInstanceIds,
}: GetSimilarReleasesParams): DiscogsRelease[] => {
  const sourceMasterId = sourceRelease.basic_information.master_id;
  const sourceInstanceId = sourceRelease.instance_id;
  const sourceReleaseId = parseReleaseId(sourceRelease);

  const scored: Array<{ release: DiscogsRelease; score: number }> = [];

  for (const release of releases) {
    if (release.instance_id === sourceInstanceId) {
      continue;
    }

    if (excludeInstanceIds?.has(release.instance_id)) {
      continue;
    }

    const candidateReleaseId = parseReleaseId(release);
    if (sourceReleaseId && candidateReleaseId === sourceReleaseId) {
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

  return dedupeSimilarResults(scored, limit);
};
