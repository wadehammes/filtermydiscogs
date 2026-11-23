import { toPublicPlaylistReleaseSnapshot } from "src/lib/release-data-validation";
import type { AddPlaylistTrackBody } from "src/lib/validation/playlist.schemas";
import type { DiscogsRelease } from "src/types";
import { buildUserTrackMetadataBody } from "src/utils/buildUserTrackMetadataBody";
import { definedProps } from "src/utils/definedProps";

export const buildAddPlaylistTrackBody = ({
  release,
  trackPosition,
  trackTitle,
  artist,
  releaseTitle,
  youtubeId,
}: {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle: string;
  artist?: string;
  releaseTitle?: string;
  youtubeId?: string | null;
}): AddPlaylistTrackBody => ({
  ...buildUserTrackMetadataBody({
    release,
    trackPosition,
    trackTitle,
    ...definedProps({
      artist,
      releaseTitle,
      youtubeId,
    }),
  }),
  release_snapshot: toPublicPlaylistReleaseSnapshot(release),
});
