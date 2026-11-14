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
  tieBreakSeed?: number;
}

const hashInstanceIdWithSeed = (instanceId: string, seed: number): number => {
  let hash = seed;
  const value = `${seed}:${instanceId}`;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return hash;
};

const STYLE_WEIGHT = 0.65;
const GENRE_WEIGHT = 0.35;
const SHARED_ARTIST_PENALTY = 0.2;
const SHARED_LABEL_BOOST = 0.08;
const SHARED_FORMAT_BOOST = 0.05;
const TAG_OVERLAP_BONUS_PER_TAG = 0.025;
const TAG_OVERLAP_BONUS_MAX = 0.15;
const YEAR_PROXIMITY_MAX_BOOST = 0.12;
const YEAR_PROXIMITY_WINDOW = 8;

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

const buildArtistKeySet = (
  artists: DiscogsArtist[] | undefined,
): Set<string> => {
  const keys = new Set<string>();

  artists?.forEach((artist) => {
    for (const key of getArtistMatchKeys(artist)) {
      keys.add(key);
    }
  });

  return keys;
};

const buildLabelKeySet = (
  labels: DiscogsBasicInformation["labels"] | undefined,
): Set<string> => {
  const keys = new Set<string>();

  labels?.forEach((label) => {
    for (const key of getLabelMatchKeys(label)) {
      keys.add(key);
    }
  });

  return keys;
};

const candidateSharesKey = (
  sourceKeys: Set<string>,
  candidates: DiscogsArtist[] | undefined,
  getKeys: (artist: DiscogsArtist) => string[],
): boolean => {
  for (const candidate of candidates ?? []) {
    for (const key of getKeys(candidate)) {
      if (sourceKeys.has(key)) {
        return true;
      }
    }
  }

  return false;
};

const candidateSharesLabelKey = (
  sourceKeys: Set<string>,
  candidateLabels: DiscogsBasicInformation["labels"] | undefined,
): boolean => {
  for (const label of candidateLabels ?? []) {
    for (const key of getLabelMatchKeys(label)) {
      if (sourceKeys.has(key)) {
        return true;
      }
    }
  }

  return false;
};

const countSharedTags = ({
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
  const sourceTags = new Set([...sourceGenres, ...sourceStyles]);
  const candidateTags = new Set([...candidateGenres, ...candidateStyles]);
  let overlap = 0;

  for (const tag of sourceTags) {
    if (candidateTags.has(tag)) {
      overlap += 1;
    }
  }

  return overlap;
};

const getTagOverlapBoost = (sharedTagCount: number): number => {
  if (sharedTagCount === 0) {
    return 0;
  }

  return Math.min(
    sharedTagCount * TAG_OVERLAP_BONUS_PER_TAG,
    TAG_OVERLAP_BONUS_MAX,
  );
};

const getPrimaryFormatName = (
  formats: DiscogsBasicInformation["formats"] | undefined,
): string => {
  const name = formats?.[0]?.name;

  return name ? normalizeTag(name) : "";
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

type SimilarReleaseSourceContext = {
  sourceGenres: Set<string>;
  sourceStyles: Set<string>;
  hasSourceTags: boolean;
  sourceArtistKeys: Set<string>;
  sourceLabelKeys: Set<string>;
  sourcePrimaryFormat: string;
  sourceYear: number;
  sourceMasterId: number | undefined;
  sourceInstanceId: string;
  sourceReleaseId: number | null;
};

const buildSimilarReleaseSourceContext = (
  sourceRelease: DiscogsRelease,
): SimilarReleaseSourceContext => {
  const sourceInfo = sourceRelease.basic_information;
  const sourceGenres = normalizeTagSet(sourceInfo.genres);
  const sourceStyles = normalizeTagSet(sourceInfo.styles);

  return {
    sourceGenres,
    sourceStyles,
    hasSourceTags: sourceGenres.size > 0 || sourceStyles.size > 0,
    sourceArtistKeys: buildArtistKeySet(sourceInfo.artists),
    sourceLabelKeys: buildLabelKeySet(sourceInfo.labels),
    sourcePrimaryFormat: getPrimaryFormatName(sourceInfo.formats),
    sourceYear: sourceInfo.year,
    sourceMasterId: sourceInfo.master_id,
    sourceInstanceId: sourceRelease.instance_id,
    sourceReleaseId: parseReleaseId(sourceRelease),
  };
};

export const releaseHasSimilarMatchTags = (
  release: DiscogsRelease,
): boolean => {
  const { genres, styles } = release.basic_information;

  return (genres?.length ?? 0) > 0 || (styles?.length ?? 0) > 0;
};

const scoreSimilarReleaseWithContext = (
  source: SimilarReleaseSourceContext,
  candidateRelease: DiscogsRelease,
): number | null => {
  const candidateInfo = candidateRelease.basic_information;
  const candidateGenres = normalizeTagSet(candidateInfo.genres);
  const candidateStyles = normalizeTagSet(candidateInfo.styles);
  const sharedArtist = candidateSharesKey(
    source.sourceArtistKeys,
    candidateInfo.artists,
    getArtistMatchKeys,
  );
  const styleScore = jaccardSimilarity(source.sourceStyles, candidateStyles);

  if (source.sourceStyles.size > 0 && styleScore === 0) {
    return null;
  }

  const tagScore = getWeightedTagScore({
    sourceGenres: source.sourceGenres,
    sourceStyles: source.sourceStyles,
    candidateGenres,
    candidateStyles,
  });

  if (!source.hasSourceTags || tagScore === 0) {
    return null;
  }

  let score =
    tagScore +
    getTagOverlapBoost(
      countSharedTags({
        sourceGenres: source.sourceGenres,
        sourceStyles: source.sourceStyles,
        candidateGenres,
        candidateStyles,
      }),
    );

  if (sharedArtist) {
    score -= SHARED_ARTIST_PENALTY;
  }

  if (candidateSharesLabelKey(source.sourceLabelKeys, candidateInfo.labels)) {
    score += SHARED_LABEL_BOOST;
  }

  const candidatePrimaryFormat = getPrimaryFormatName(candidateInfo.formats);

  if (
    source.sourcePrimaryFormat !== "" &&
    source.sourcePrimaryFormat === candidatePrimaryFormat
  ) {
    score += SHARED_FORMAT_BOOST;
  }

  score += getYearProximityBoost(source.sourceYear, candidateInfo.year);

  return score;
};

const sortScoredSimilarReleases = (
  scored: Array<{ release: DiscogsRelease; score: number }>,
  tieBreakSeed?: number,
): void => {
  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (tieBreakSeed !== undefined && tieBreakSeed > 0) {
      return (
        hashInstanceIdWithSeed(left.release.instance_id, tieBreakSeed) -
        hashInstanceIdWithSeed(right.release.instance_id, tieBreakSeed)
      );
    }

    return left.release.basic_information.title.localeCompare(
      right.release.basic_information.title,
    );
  });
};

const collectScoredSimilarReleases = ({
  releases,
  source,
  excludeInstanceIds,
}: {
  releases: DiscogsRelease[];
  source: SimilarReleaseSourceContext;
  excludeInstanceIds?: ReadonlySet<string>;
}): Array<{ release: DiscogsRelease; score: number }> => {
  const scored: Array<{ release: DiscogsRelease; score: number }> = [];

  for (const release of releases) {
    if (release.instance_id === source.sourceInstanceId) {
      continue;
    }

    if (excludeInstanceIds?.has(release.instance_id)) {
      continue;
    }

    const candidateReleaseId = parseReleaseId(release);
    if (
      source.sourceReleaseId &&
      candidateReleaseId === source.sourceReleaseId
    ) {
      continue;
    }

    if (
      source.sourceMasterId &&
      release.basic_information.master_id === source.sourceMasterId
    ) {
      continue;
    }

    const score = scoreSimilarReleaseWithContext(source, release);

    if (score === null) {
      continue;
    }

    scored.push({ release, score });
  }

  return scored;
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
  tieBreakSeed,
}: GetSimilarReleasesParams): DiscogsRelease[] => {
  const source = buildSimilarReleaseSourceContext(sourceRelease);
  const scored = collectScoredSimilarReleases({
    releases,
    source,
    ...(excludeInstanceIds !== undefined ? { excludeInstanceIds } : {}),
  });

  sortScoredSimilarReleases(scored, tieBreakSeed);

  return dedupeSimilarResults(scored, limit);
};

export type GetSimilarReleasesModalSnapshotParams = {
  releases: DiscogsRelease[];
  sourceRelease: DiscogsRelease;
  batchLimit: number;
  excludedInstanceIds: ReadonlySet<string>;
  tieBreakSeed?: number;
};

export const getSimilarReleasesModalSnapshot = ({
  releases,
  sourceRelease,
  batchLimit,
  excludedInstanceIds,
  tieBreakSeed,
}: GetSimilarReleasesModalSnapshotParams): {
  totalMatchCount: number;
  batch: DiscogsRelease[];
} => {
  const source = buildSimilarReleaseSourceContext(sourceRelease);
  const scoredForTotal = collectScoredSimilarReleases({ releases, source });

  sortScoredSimilarReleases(scoredForTotal);

  const fullPool = dedupeSimilarResults(scoredForTotal, releases.length);
  const totalMatchCount = fullPool.length;

  const needsSeparateBatch =
    excludedInstanceIds.size > 0 || (tieBreakSeed ?? 0) > 0;

  if (!needsSeparateBatch) {
    return {
      totalMatchCount,
      batch: fullPool.slice(0, batchLimit),
    };
  }

  const scoredForBatch = collectScoredSimilarReleases({
    releases,
    source,
    excludeInstanceIds: excludedInstanceIds,
  });

  sortScoredSimilarReleases(scoredForBatch, tieBreakSeed);

  return {
    totalMatchCount,
    batch: dedupeSimilarResults(scoredForBatch, batchLimit),
  };
};
