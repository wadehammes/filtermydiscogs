import { prisma } from "src/lib/db";
import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";
import type { DiscogsRelease } from "src/types";
import type {
  TopUserTrack,
  TopUserTracksResponse,
} from "src/types/dashboard.types";

const userTrackWhere = (userId: number, trackKey: string) => ({
  user_id_track_key: { user_id: userId, track_key: trackKey },
});

const metadataFromRecordBody = (body: UserTrackRecordBody, now: Date) => ({
  track_title: body.track_title,
  track_position: body.track_position,
  instance_id: body.instance_id,
  ...(body.youtube_id !== undefined ? { youtube_id: body.youtube_id } : {}),
  ...(body.artist !== undefined ? { artist: body.artist } : {}),
  ...(body.release_title !== undefined
    ? { release_title: body.release_title }
    : {}),
  updated_at: now,
});

export const recordUserTrackEvent = async (
  userId: number,
  body: UserTrackRecordBody,
): Promise<void> => {
  const now = new Date();
  const sharedData = metadataFromRecordBody(body, now);
  const where = userTrackWhere(userId, body.track_key);

  if (body.event === "play") {
    await prisma.userTrack.upsert({
      where,
      create: {
        user_id: userId,
        track_key: body.track_key,
        ...sharedData,
        play_count: 1,
        listen_count: 0,
        last_played_at: now,
        first_played_at: now,
      },
      update: {
        ...sharedData,
        play_count: { increment: 1 },
        last_played_at: now,
      },
    });
    return;
  }

  await prisma.userTrack.upsert({
    where,
    create: {
      user_id: userId,
      track_key: body.track_key,
      ...sharedData,
      play_count: 0,
      listen_count: 1,
      last_listened_at: now,
      first_played_at: now,
    },
    update: {
      ...sharedData,
      listen_count: { increment: 1 },
      last_listened_at: now,
    },
  });
};

export const fetchUserTrackStats = async (
  userId: number,
  trackKeys: string[],
): Promise<Record<string, { play_count: number; listen_count: number }>> => {
  if (trackKeys.length === 0) {
    return {};
  }

  const rows = await prisma.userTrack.findMany({
    where: {
      user_id: userId,
      track_key: { in: trackKeys },
    },
    select: {
      track_key: true,
      play_count: true,
      listen_count: true,
    },
  });

  const stats: Record<string, { play_count: number; listen_count: number }> =
    {};

  for (const key of trackKeys) {
    stats[key] = { play_count: 0, listen_count: 0 };
  }

  for (const row of rows) {
    stats[row.track_key] = {
      play_count: row.play_count,
      listen_count: row.listen_count,
    };
  }

  return stats;
};

const topUserTrackSelect = {
  track_key: true,
  instance_id: true,
  track_title: true,
  track_position: true,
  artist: true,
  release_title: true,
  play_count: true,
  listen_count: true,
} as const;

type TopUserTrackRow = Omit<TopUserTrack, "release_thumb">;

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

  const crateRows = await prisma.crateRelease.findMany({
    where: {
      user_id: userId,
      instance_id: { in: instanceIds },
    },
    select: {
      instance_id: true,
      release_data: true,
    },
  });

  for (const row of crateRows) {
    if (thumbByInstanceId.has(row.instance_id)) {
      continue;
    }

    const thumb = thumbUrlFromReleaseData(row.release_data);

    if (thumb) {
      thumbByInstanceId.set(row.instance_id, thumb);
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
    prisma.userTrack.findMany({
      where: { user_id: userId, play_count: { gt: 0 } },
      orderBy: [{ play_count: "desc" }, { last_played_at: "desc" }],
      take: limit,
      select: topUserTrackSelect,
    }),
    prisma.userTrack.findMany({
      where: { user_id: userId, listen_count: { gt: 0 } },
      orderBy: [{ listen_count: "desc" }, { last_listened_at: "desc" }],
      take: limit,
      select: topUserTrackSelect,
    }),
  ]);

  const instanceIds = [
    ...new Set(
      [...mostPlayed, ...mostListened].map((track) => track.instance_id),
    ),
  ];
  const thumbByInstanceId = await loadThumbByInstanceId(userId, instanceIds);

  return {
    most_played: withReleaseThumbs(mostPlayed, thumbByInstanceId),
    most_listened: withReleaseThumbs(mostListened, thumbByInstanceId),
  };
};
