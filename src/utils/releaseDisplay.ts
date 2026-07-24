import type {
  DiscogsExtraArtist,
  DiscogsRelease,
  DiscogsReleaseDetail,
  DiscogsTrack,
} from "src/types";
import { parseCommunityRatingAverage } from "src/utils/communityRatingSort";

interface DiscogsCreditName {
  name: string;
  anv?: string;
  join?: string;
}

export const normalizeDiscogsJoin = (join: string | undefined): string => {
  if (!join) {
    return ", ";
  }

  if (join.includes(" ")) {
    return join;
  }

  const trimmed = join.trim();

  if (!trimmed) {
    return ", ";
  }

  return ` ${trimmed} `;
};

export const formatArtistNames = (release: DiscogsRelease): string => {
  return formatDiscogsCreditNames(release.basic_information.artists);
};

export const formatDiscogsCreditNames = (
  credits: DiscogsCreditName[] | undefined,
): string => {
  if (!credits?.length) {
    return "";
  }

  return credits
    .map((credit, index) => {
      const displayName = credit.anv?.trim() || credit.name;
      const join =
        index < credits.length - 1 ? normalizeDiscogsJoin(credit.join) : "";

      return `${displayName}${join}`;
    })
    .join("");
};

export const formatTrackExtraartists = (
  extraartists: DiscogsExtraArtist[] | undefined,
): string => {
  if (!extraartists?.length) {
    return "";
  }

  return extraartists
    .map((credit) => {
      const displayName = credit.anv?.trim() || credit.name;

      if (credit.role?.trim()) {
        return `${displayName} (${credit.role})`;
      }

      return displayName;
    })
    .join(", ");
};

const normalizeCreditText = (value: string): string => {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
};

const isVariousArtistsRelease = (releaseArtistNames: string): boolean => {
  return normalizeCreditText(releaseArtistNames).includes("various");
};

export const formatTrackCreditsLine = ({
  track,
  releaseArtistNames,
}: {
  track: DiscogsTrack;
  releaseArtistNames: string;
}): string | null => {
  const trackArtists = formatDiscogsCreditNames(track.artists);
  const extraartists = formatTrackExtraartists(track.extraartists);
  const parts = [trackArtists, extraartists].filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  if (isVariousArtistsRelease(releaseArtistNames) && trackArtists) {
    return parts.join(" · ");
  }

  if (extraartists) {
    return parts.join(" · ");
  }

  if (
    trackArtists &&
    normalizeCreditText(trackArtists) !==
      normalizeCreditText(releaseArtistNames)
  ) {
    return parts.join(" · ");
  }

  return null;
};

export const getCommunityRatingFromReleaseDetail = (
  releaseDetail: DiscogsReleaseDetail | undefined,
): { average: number; count: number } | null => {
  const average = parseCommunityRatingAverage(releaseDetail?.community);

  if (average === null) {
    return null;
  }

  const count = releaseDetail?.community?.rating?.count ?? 0;

  return {
    average,
    count,
  };
};

export const formatCommunityRatingAverage = (average: number): string => {
  return average.toFixed(1);
};

interface FormatReleaseMetaLineParams {
  release: DiscogsRelease;
  includeCatno?: boolean;
}

export const formatReleaseMetaLine = ({
  release,
  includeCatno = true,
}: FormatReleaseMetaLineParams): string => {
  const { labels, year } = release.basic_information;
  const parts: string[] = [];

  if (labels[0]?.name) {
    parts.push(labels[0].name);
  }

  if (year > 0) {
    parts.push(String(year));
  }

  if (includeCatno) {
    const catno = labels[0]?.catno ? String(labels[0].catno) : "";

    if (catno) {
      parts.push(catno);
    }
  }

  return parts.join(" · ");
};

export const formatReleaseHeroMetaLine = ({
  release,
  communityRating,
}: {
  release: DiscogsRelease;
  communityRating: { average: number; count: number } | null;
}): {
  text: string;
  communityRating: { average: number; count: number } | null;
} => {
  const parts: string[] = [];
  const releaseMeta = formatReleaseMetaLine({ release });

  if (releaseMeta) {
    parts.push(releaseMeta);
  }

  if (release.rating > 0) {
    parts.push(`You ${release.rating}/5`);
  }

  return {
    text: parts.join(" · "),
    communityRating,
  };
};
