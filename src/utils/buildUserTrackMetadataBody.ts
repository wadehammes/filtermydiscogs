import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { parseReleaseId } from "src/utils/releaseNotes";
import { buildTrackKey } from "src/utils/userTrack";

export const buildUserTrackMetadataBody = ({
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
}): UserTrackMetadataBody => {
  const instanceId = String(release.instance_id);
  const track_key = buildTrackKey(instanceId, trackPosition);
  const trimmedYoutube = youtubeId?.trim();
  const discogsReleaseId = parseReleaseId(release);

  return {
    track_key,
    instance_id: instanceId,
    track_position: trackPosition,
    track_title: trackTitle,
    ...definedProps({
      artist,
      release_title: releaseTitle,
      youtube_id: trimmedYoutube ? trimmedYoutube : undefined,
      discogs_release_id:
        discogsReleaseId !== null ? discogsReleaseId : undefined,
    }),
  };
};
