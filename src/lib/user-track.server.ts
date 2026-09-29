import { orm, ormTimestamp } from "src/lib/db";
import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";
import type { DiscogsRelease } from "src/types";
import type {
  TopUserTrack,
  TopUserTracksResponse,
} from "src/types/dashboard.types";

const metadataFromRecordBody = (body: UserTrackRecordBody, now: Date) => ({
  trackTitle: body.track_title,
  trackPosition: body.track_position,
  instanceId: body.instance_id,
  ...(body.youtube_id !== undefined ? { youtubeId: body.youtube_id } : {}),
  ...(body.artist !== undefined ? { artist: body.artist } : {}),
  ...(body.release_title !== undefined
    ? { releaseTitle: body.release_title }
    : {}),
  updatedAt: ormTimestamp(now),
});

export const recordUserTrackEvent = async (
  userId: number,
  body: UserTrackRecordBody,
): Promise<void> => {
  const now = new Date();
  const sharedData = metadataFromRecordBody(body, now);
  const where = { userId, trackKey: body.track_key };
  const existing = await orm.UserTracks.where(where).first();

  if (body.event === "play") {
    if (existing) {
      await orm.UserTracks.where(where).update({
        ...sharedData,
        playCount: existing.playCount + 1,
        lastPlayedAt: ormTimestamp(now),
      });
      return;
    }

    await orm.UserTracks.create({
      userId,
      trackKey: body.track_key,
      ...sharedData,
      playCount: 1,
      listenCount: 0,
      lastPlayedAt: ormTimestamp(now),
      firstPlayedAt: ormTimestamp(now),
    });
    return;
  }

  if (existing) {
    await orm.UserTracks.where(where).update({
      ...sharedData,
      listenCount: existing.listenCount + 1,
      lastListenedAt: ormTimestamp(now),
    });
    return;
  }

  await orm.UserTracks.create({
    userId,
    trackKey: body.track_key,
    ...sharedData,
    playCount: 0,
    listenCount: 1,
    lastListenedAt: ormTimestamp(now),
    firstPlayedAt: ormTimestamp(now),
  });
};

export const fetchUserTrackStats = async (
  userId: number,
  trackKeys: string[],
): Promise<Record<string, { play_count: number; listen_count: number }>> => {
  if (trackKeys.length === 0) {
    return {};
  }

  const rows = await orm.UserTracks.where({ userId })
    .where((track) => track.trackKey.in(trackKeys))
    .select("trackKey", "playCount", "listenCount")
    .all();

  const stats: Record<string, { play_count: number; listen_count: number }> =
    {};

  for (const key of trackKeys) {
    stats[key] = { play_count: 0, listen_count: 0 };
  }

  for (const row of rows) {
    stats[row.trackKey] = {
      play_count: row.playCount,
      listen_count: row.listenCount,
    };
  }

  return stats;
};

type TopUserTrackRow = Omit<TopUserTrack, "release_thumb">;

const mapTopUserTrackRow = (row: {
  trackKey: string;
  instanceId: string;
  trackTitle: string;
  trackPosition: string;
  artist: string | null;
  releaseTitle: string | null;
  playCount: number;
  listenCount: number;
}): TopUserTrackRow => ({
  track_key: row.trackKey,
  instance_id: row.instanceId,
  track_title: row.trackTitle,
  track_position: row.trackPosition,
  artist: row.artist,
  release_title: row.releaseTitle,
  play_count: row.playCount,
  listen_count: row.listenCount,
});

const topUserTrackSelect = [
  "trackKey",
  "instanceId",
  "trackTitle",
  "trackPosition",
  "artist",
  "releaseTitle",
  "playCount",
  "listenCount",
] as const;

const thumbUrlFromReleaseData = (releaseData: unknown): string | null => {
  const release = releaseData as DiscogsRelease;
  const basic = release?.basic_information;

  if (!basic) {
    return null;
  }

  return basic.cover_image || basic.thumb || null;
};

const loadThumbByInstanceId = async (
  userId: number,
  instanceIds: string[],
): Promise<Map<string, string>> => {
  const thumbByInstanceId = new Map<string, string>();

  if (instanceIds.length === 0) {
    return thumbByInstanceId;
  }

  const crateRows = await orm.CrateReleases.where({ userId })
    .where((release) => release.instanceId.in(instanceIds))
    .select("instanceId", "releaseData")
    .all();

  for (const row of crateRows) {
    if (thumbByInstanceId.has(row.instanceId)) {
      continue;
    }

    const thumb = thumbUrlFromReleaseData(row.releaseData);

    if (thumb) {
      thumbByInstanceId.set(row.instanceId, thumb);
    }
  }

  return thumbByInstanceId;
};

const withReleaseThumbs = (
  tracks: TopUserTrackRow[],
  thumbByInstanceId: Map<string, string>,
): TopUserTrack[] =>
  tracks.map((track) => ({
    ...track,
    release_thumb: thumbByInstanceId.get(track.instance_id) ?? null,
  }));

export const fetchTopUserTracks = async (
  userId: number,
  limit: number,
): Promise<TopUserTracksResponse> => {
  const [mostPlayed, mostListened] = await Promise.all([
    orm.UserTracks.where({ userId })
      .where((track) => track.playCount.gt(0))
      .orderBy((track) => track.playCount.desc())
      .orderBy((track) => track.lastPlayedAt.desc())
      .limit(limit)
      .select(...topUserTrackSelect)
      .all(),
    orm.UserTracks.where({ userId })
      .where((track) => track.listenCount.gt(0))
      .orderBy((track) => track.listenCount.desc())
      .orderBy((track) => track.lastListenedAt.desc())
      .limit(limit)
      .select(...topUserTrackSelect)
      .all(),
  ]);

  const instanceIds = [
    ...new Set(
      [...mostPlayed, ...mostListened].map((track) => track.instanceId),
    ),
  ];
  const thumbByInstanceId = await loadThumbByInstanceId(userId, instanceIds);

  return {
    most_played: withReleaseThumbs(
      mostPlayed.map(mapTopUserTrackRow),
      thumbByInstanceId,
    ),
    most_listened: withReleaseThumbs(
      mostListened.map(mapTopUserTrackRow),
      thumbByInstanceId,
    ),
  };
};
