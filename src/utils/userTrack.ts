import type { DiscogsRelease } from "src/types";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { getQueueItemKey } from "src/utils/playbackQueue";
import { formatArtistNames } from "src/utils/releaseDisplay";
import {
  findTrackIndexByPosition,
  flattenTracklist,
} from "src/utils/releasePlayback";

export const TRACK_LISTEN_MIN_MS = 30_000;

export type UserTrackStatCounts = {
  play_count: number;
  listen_count: number;
};

export interface UserTrackRecordFields {
  track_key: string;
  track_title: string;
  track_position: string;
  instance_id: string;
  youtube_id?: string;
  artist?: string;
  release_title?: string;
}

export const buildTrackKey = (
  instanceId: string | number,
  trackPosition: string,
): string => getQueueItemKey({ instanceId: String(instanceId), trackPosition });

type CatalogTitleTrackRef = {
  track_key: string;
  instance_id: string;
  track_position: string;
};

export const buildCatalogTitleByTrackKey = (
  tracks: readonly CatalogTitleTrackRef[],
  releaseIndex: Map<string, DiscogsRelease>,
  releaseDetailById: Map<string, { tracklist?: DiscogsTrack[] } | undefined>,
): Map<string, string> => {
  const titles = new Map<string, string>();

  for (const track of tracks) {
    const release = releaseIndex.get(String(track.instance_id));
    const releaseId = release?.basic_information?.id;

    if (releaseId == null) {
      continue;
    }

    const detail = releaseDetailById.get(String(releaseId));
    const catalogTitle = detail?.tracklist
      ? findTracklistTitleByPosition(detail.tracklist, track.track_position)
      : null;

    if (catalogTitle) {
      titles.set(track.track_key, catalogTitle);
    }
  }

  return titles;
};

export const findTracklistTitleByPosition = (
  tracklist: DiscogsTrack[],
  position: string,
): string | null => {
  const flat = flattenTracklist(tracklist);
  const index = findTrackIndexByPosition(flat, position);

  if (index < 0) {
    return null;
  }

  const title = flat[index]?.title.trim();

  return title || null;
};

export const formatTopUserTrackHeadLabel = ({
  track_position,
  track_title,
  catalogTrackTitle,
}: {
  track_position: string;
  track_title: string;
  catalogTrackTitle?: string | null;
}): string => {
  const position = track_position.trim();
  const stored = track_title.trim();
  const catalog = catalogTrackTitle?.trim() ?? "";

  let name = "";

  if (stored && stored !== position) {
    name = stored;
  } else if (catalog && catalog !== position) {
    name = catalog;
  } else if (stored) {
    name = stored;
  } else if (catalog) {
    name = catalog;
  } else {
    return position || "Untitled track";
  }

  if (position && name !== position) {
    const positionPrefix = `${position.toLowerCase()} `;
    const positionDashPrefix = `${position.toLowerCase()} - `;

    if (
      name.toLowerCase().startsWith(positionDashPrefix) ||
      name.toLowerCase().startsWith(positionPrefix)
    ) {
      return name;
    }

    return `${position} - ${name}`;
  }

  return name;
};

export const formatUserTrackStatsLabel = (
  stats: UserTrackStatCounts,
): string | null => {
  const parts: string[] = [];

  if (stats.play_count > 0) {
    parts.push(
      `${stats.play_count} ${stats.play_count === 1 ? "play" : "plays"}`,
    );
  }

  if (stats.listen_count > 0) {
    parts.push(
      `${stats.listen_count} ${stats.listen_count === 1 ? "listen" : "listens"}`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : null;
};

export const formatUserTrackListenLabel = (
  stats: UserTrackStatCounts,
): string | null => {
  if (stats.listen_count <= 0) {
    return null;
  }

  return `${stats.listen_count} ${stats.listen_count === 1 ? "listen" : "listens"}`;
};

export const formatUserTrackListenTooltip = (
  stats: UserTrackStatCounts,
): string => {
  const listenRule =
    "A listen is 30+ seconds in a row, or the full track. Skipping early does not count.";

  if (stats.play_count <= stats.listen_count) {
    return listenRule;
  }

  const playLabel = stats.play_count === 1 ? "play" : "plays";
  const listenLabel = stats.listen_count === 1 ? "listen" : "listens";

  return `${stats.play_count} ${playLabel}, ${stats.listen_count} ${listenLabel}. ${listenRule}`;
};

export const mapTrackStatsByPosition = (
  instanceId: string | number,
  tracks: readonly { position: string }[],
  stats: Record<string, UserTrackStatCounts> | undefined,
): Record<string, UserTrackStatCounts> | undefined => {
  if (!stats) {
    return undefined;
  }

  const byPosition: Record<string, UserTrackStatCounts> = {};

  for (const track of tracks) {
    const row = stats[buildTrackKey(instanceId, track.position)];
    if (row && (row.play_count > 0 || row.listen_count > 0)) {
      byPosition[track.position] = row;
    }
  }

  return Object.keys(byPosition).length > 0 ? byPosition : undefined;
};

export const buildUserTrackFieldsFromQueueItem = (
  item: PlaybackQueueItem,
  youtubeId?: string | null,
): UserTrackRecordFields => {
  const { basic_information } = item.release;

  return {
    track_key: getQueueItemKey(item),
    track_title: item.trackTitle,
    track_position: item.trackPosition,
    instance_id: String(item.release.instance_id),
    ...(youtubeId ? { youtube_id: youtubeId } : {}),
    artist: formatArtistNames(item.release),
    release_title: basic_information.title,
  };
};

export const buildUserTrackFieldsFromRelease = ({
  release,
  trackPosition,
  trackTitle,
  youtubeId,
}: {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle: string;
  youtubeId?: string | null;
}): UserTrackRecordFields =>
  buildUserTrackFieldsFromQueueItem(
    {
      instanceId: String(release.instance_id),
      trackPosition,
      trackTitle,
      release,
    },
    youtubeId,
  );
