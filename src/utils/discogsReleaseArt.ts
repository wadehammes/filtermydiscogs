import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { parseReleaseId } from "src/utils/releaseNotes";

export const resolveDiscogsReleaseDetailCoverUri = (
  detail: Pick<DiscogsReleaseDetail, "images" | "thumb">,
): string => {
  const images = detail.images ?? [];
  const readFullUri = (uri: unknown): string =>
    typeof uri === "string" ? uri.trim() : "";

  const primary = images.find(
    (image) => image.type === "primary" && readFullUri(image.uri),
  );

  if (primary) {
    return readFullUri(primary.uri);
  }

  for (const image of images) {
    const uri = readFullUri(image.uri);

    if (uri) {
      return uri;
    }
  }

  return "";
};

export const discogsDetailThumbAndCover = (
  detail: Pick<DiscogsReleaseDetail, "images" | "thumb">,
): { thumb: string; cover_image: string } => {
  const coverFromImages = resolveDiscogsReleaseDetailCoverUri(detail);
  const thumb = detail.thumb ?? coverFromImages ?? "";
  const cover_image = coverFromImages || thumb;

  return { thumb, cover_image };
};

export const buildDiscogsReleaseFromDetail = (
  detail: DiscogsReleaseDetail,
  instanceId: string,
): DiscogsRelease => {
  const { thumb, cover_image } = discogsDetailThumbAndCover(detail);

  return {
    instance_id: String(instanceId),
    date_added: new Date().toISOString(),
    rating: 0,
    basic_information: {
      id: detail.id,
      title: detail.title,
      artists: detail.artists ?? [],
      labels: detail.labels ?? [],
      year: detail.year ?? 0,
      styles: [],
      formats: [],
      thumb,
      cover_image,
      resource_url: `https://api.discogs.com/releases/${detail.id}`,
      uri: detail.uri ?? `https://www.discogs.com/release/${detail.id}`,
      master_id: 0,
      master_url: null,
    },
    tracklist: detail.tracklist,
    videos: detail.videos,
  };
};

export const applyDiscogsDetailImagesToRelease = (
  release: DiscogsRelease,
  detail: Pick<DiscogsReleaseDetail, "images" | "thumb" | "id">,
): DiscogsRelease => {
  const { thumb, cover_image } = discogsDetailThumbAndCover(detail);

  return {
    ...release,
    basic_information: {
      ...release.basic_information,
      id: detail.id ?? release.basic_information.id,
      thumb: thumb || release.basic_information.thumb,
      cover_image: cover_image || release.basic_information.cover_image,
    },
  };
};

export const buildPlaylistReleaseFromDiscogsDetail = (
  detail: DiscogsReleaseDetail,
  track: Pick<PlaylistTrackRow, "instance_id" | "release_title" | "artist">,
): DiscogsRelease => {
  const release = buildDiscogsReleaseFromDetail(
    detail,
    String(track.instance_id),
  );
  const title = track.release_title?.trim() || release.basic_information.title;
  const artists = track.artist?.trim()
    ? [{ name: track.artist.trim() }]
    : release.basic_information.artists;

  return {
    ...release,
    basic_information: {
      ...release.basic_information,
      title,
      artists,
    },
  };
};

export const resolveDiscogsReleaseIdForPlaylistTrack = (
  track: Pick<PlaylistTrackRow, "discogs_release_id">,
  crateSnapshot: DiscogsRelease | undefined,
): number | null => {
  if (track.discogs_release_id !== null && track.discogs_release_id > 0) {
    return track.discogs_release_id;
  }

  if (!crateSnapshot) {
    return null;
  }

  return parseReleaseId(crateSnapshot);
};

export const playlistReleaseHasDisplayArt = (
  release: DiscogsRelease | undefined,
): boolean => {
  if (!release) {
    return false;
  }

  const thumb = release.basic_information.thumb?.trim() ?? "";
  const cover = release.basic_information.cover_image?.trim() ?? "";

  return thumb.length > 0 || cover.length > 0;
};

export const collectUniquePlaylistDiscogsReleaseIdsNeedingArtHydration = (
  tracks: PlaylistTrackRow[],
  releaseByInstanceId: Map<string, DiscogsRelease>,
): string[] => {
  const ids = new Set<string>();

  for (const track of tracks) {
    const release = releaseByInstanceId.get(String(track.instance_id));

    if (playlistReleaseHasDisplayArt(release)) {
      continue;
    }

    const discogsId = resolveDiscogsReleaseIdForPlaylistTrack(track, release);

    if (discogsId !== null) {
      ids.add(String(discogsId));
    }
  }

  return [...ids];
};

export const buildDiscogsReleaseDetailSeedFromPlaylistRelease = (
  release: DiscogsRelease,
): DiscogsReleaseDetail | null => {
  const releaseId = release.basic_information.id;

  if (releaseId == null || releaseId <= 0) {
    return null;
  }

  const thumb = release.basic_information.thumb?.trim() ?? "";
  const cover = release.basic_information.cover_image?.trim() ?? "";

  if (!(thumb || cover)) {
    return null;
  }

  const primaryUri = cover || thumb;

  const seed: DiscogsReleaseDetail = {
    id: releaseId,
    uri:
      release.basic_information.uri ??
      `https://www.discogs.com/release/${releaseId}`,
    title: release.basic_information.title,
    artists: release.basic_information.artists,
    thumb: thumb || cover,
    images: [{ type: "primary", uri: primaryUri }],
  };

  if (Array.isArray(release.tracklist)) {
    seed.tracklist = release.tracklist;
  }

  if (Array.isArray(release.videos)) {
    seed.videos = release.videos;
  }

  return seed;
};

export const collectUniquePlaylistDiscogsReleaseIds = (
  tracks: PlaylistTrackRow[],
  releaseByInstanceId: Map<string, DiscogsRelease>,
): string[] => {
  const ids = new Set<string>();

  for (const track of tracks) {
    const release = releaseByInstanceId.get(String(track.instance_id));
    const discogsId = resolveDiscogsReleaseIdForPlaylistTrack(track, release);

    if (discogsId !== null) {
      ids.add(String(discogsId));
    }
  }

  return [...ids];
};

export const mergePlaylistReleaseWithDiscogsDetail = (
  release: DiscogsRelease | undefined,
  detail: DiscogsReleaseDetail,
  track: Pick<PlaylistTrackRow, "instance_id" | "release_title" | "artist">,
): DiscogsRelease => {
  const fromDetail = buildPlaylistReleaseFromDiscogsDetail(detail, track);

  if (!release) {
    return fromDetail;
  }

  const existingThumb = release.basic_information.thumb?.trim() ?? "";
  const existingCover = release.basic_information.cover_image?.trim() ?? "";

  return {
    ...release,
    ...fromDetail,
    basic_information: {
      ...release.basic_information,
      ...fromDetail.basic_information,
      thumb: existingThumb || fromDetail.basic_information.thumb,
      cover_image: existingCover || fromDetail.basic_information.cover_image,
    },
    tracklist: detail.tracklist ?? release.tracklist,
    videos: detail.videos ?? release.videos,
  };
};
