import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { formatDiscogsCreditNames } from "src/utils/releaseDisplay";
import {
  buildReleasePlaybackMatchIndex,
  flattenTracklist,
  parseYoutubeVideoId,
} from "src/utils/releasePlayback";

export const resolvePublicReleaseHeroDateMetaParts = (detail: {
  year?: number;
  released?: string;
}): string[] => {
  const year =
    typeof detail.year === "number" && detail.year > 0 ? detail.year : null;
  const yearStr = year !== null ? String(year) : null;
  const released =
    typeof detail.released === "string" ? detail.released.trim() : "";

  if (!released) {
    return yearStr ? [yearStr] : [];
  }

  if (!yearStr) {
    return [released];
  }

  if (released.startsWith(yearStr)) {
    return released === yearStr ? [yearStr] : [released];
  }

  return [yearStr, released];
};

export const resolvePublicReleaseCatalogNumbers = (detail: {
  labels?: ReadonlyArray<{ name?: string; catno?: string }>;
}): string[] => {
  const catnos: string[] = [];

  for (const label of detail.labels ?? []) {
    const trimmed = label.catno?.trim();

    if (trimmed) {
      catnos.push(trimmed);
    }
  }

  return [...new Set(catnos)];
};

export const formatPublicReleaseCommunityMetaParts = (
  detail: Pick<DiscogsReleaseDetail, "community">,
): string[] => {
  const parts: string[] = [];
  const community = detail.community;

  if (!community) {
    return parts;
  }

  const rating = community.rating;

  if (
    rating &&
    typeof rating.average === "number" &&
    Number.isFinite(rating.average) &&
    typeof rating.count === "number" &&
    rating.count > 0
  ) {
    const rounded = Math.round(rating.average * 10) / 10;
    const averageLabel =
      rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);

    parts.push(`Rated ${averageLabel} / 5 (${rating.count})`);
  }

  const have = community.have;
  const want = community.want;

  if (
    typeof have === "number" &&
    have >= 0 &&
    typeof want === "number" &&
    want >= 0
  ) {
    parts.push(`${have} have · ${want} want`);
  }

  return parts;
};

export interface BuildPlaylistRowsFromDiscogsReleaseDetailParams {
  detail: DiscogsReleaseDetail;
  sortOrderBase: number;
}

export const buildPlaylistRowsFromDiscogsReleaseDetail = ({
  detail,
  sortOrderBase,
}: BuildPlaylistRowsFromDiscogsReleaseDetailParams): PlaylistTrackRow[] => {
  const releaseId = detail.id;
  const flattened = flattenTracklist(detail.tracklist ?? []);
  const sortedTracks = [...flattened].sort((left, right) =>
    left.position.trim().localeCompare(right.position.trim(), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
  const artistLine = formatDiscogsCreditNames(detail.artists);
  const title = detail.title?.trim() ?? "";
  const matchIndex = buildReleasePlaybackMatchIndex(
    sortedTracks,
    detail.videos ?? [],
  );
  const rows: PlaylistTrackRow[] = [];

  for (const [index, track] of sortedTracks.entries()) {
    const position = track.position?.trim() ?? "";

    if (!position) {
      continue;
    }

    const trackTitle = track.title?.trim() ?? "";
    const matchedVideo = matchIndex.trackVideoByPosition.get(position);
    const youtubeId = matchedVideo
      ? parseYoutubeVideoId(matchedVideo.uri)
      : null;

    rows.push({
      track_key: `${releaseId}:${position}`,
      sort_order: sortOrderBase + index,
      track_title: trackTitle,
      track_position: position,
      instance_id: String(releaseId),
      artist: artistLine || null,
      release_title: title || null,
      youtube_id: youtubeId,
      discogs_release_id: releaseId,
      upCount: 0,
      downCount: 0,
    });
  }

  return rows;
};
