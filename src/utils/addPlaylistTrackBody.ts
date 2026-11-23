import type { AddPlaylistTrackBody } from "src/lib/validation/playlist.schemas";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";

export const toUserTrackMetadataBodyFromAddPlaylistTrack = (
  body: AddPlaylistTrackBody,
): UserTrackMetadataBody => {
  const { release_snapshot: _releaseSnapshot, ...metadata } = body;
  return metadata;
};
