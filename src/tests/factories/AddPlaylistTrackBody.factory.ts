import { toPublicPlaylistReleaseSnapshot } from "src/lib/release-data-validation";
import type { AddPlaylistTrackBody } from "src/lib/validation/playlist.schemas";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { trackMetadataBodyFactory } from "src/tests/factories/TrackMetadataBody.factory";
import type { DiscogsRelease } from "src/types";

const defaultSnapshotRelease = (
  instanceId: string,
  overrides?: Partial<DiscogsRelease>,
): DiscogsRelease =>
  releaseFactory.build({
    instance_id: instanceId,
    basic_information: {
      ...releaseFactory.build().basic_information,
      thumb: "https://i.discogs.com/snapshot-thumb.jpg",
      cover_image: "https://i.discogs.com/snapshot-cover.jpg",
    },
    ...overrides,
  });

export const addPlaylistTrackBodyFactory = {
  opening(
    attributes: Partial<AddPlaylistTrackBody> = {},
  ): AddPlaylistTrackBody {
    const metadata = trackMetadataBodyFactory.opening(attributes);
    const release = defaultSnapshotRelease(metadata.instance_id);
    const release_snapshot =
      attributes.release_snapshot !== undefined
        ? toPublicPlaylistReleaseSnapshot(
            attributes.release_snapshot as DiscogsRelease,
          )
        : toPublicPlaylistReleaseSnapshot(release);

    return {
      ...metadata,
      ...attributes,
      release_snapshot,
    };
  },
};
