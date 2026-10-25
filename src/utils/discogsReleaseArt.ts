import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { parseReleaseId } from "src/utils/releaseNotes";

export const resolveDiscogsReleaseDetailCoverUri = (
  detail: Pick<DiscogsReleaseDetail, "images" | "thumb">,
): string => {
  const images = detail.images ?? [];
  const primary = images.find(
    (image) => image.type === "primary" && typeof image.uri === "string",
  );

  if (primary?.uri.trim()) {
    return primary.uri.trim();
  }

  for (const image of images) {
    for (const candidate of [
      image.uri,
      (image as { uri150?: string }).uri150,
      (image as { resource_url?: string }).resource_url,
    ]) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
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

  return {
    ...release,
    ...fromDetail,
    basic_information: {
      ...release.basic_information,
      ...fromDetail.basic_information,
      thumb:
        fromDetail.basic_information.thumb || release.basic_information.thumb,
      cover_image:
        fromDetail.basic_information.cover_image ||
        release.basic_information.cover_image,
    },
    tracklist: detail.tracklist ?? release.tracklist,
    videos: detail.videos ?? release.videos,
  };
};
