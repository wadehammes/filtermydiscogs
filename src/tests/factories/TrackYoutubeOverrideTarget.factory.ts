import { faker } from "@faker-js/faker";
import type { TrackYoutubeOverrideTarget } from "src/components/TrackYoutubeOverrideDialog/TrackYoutubeOverrideDialog.component";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsRelease } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { buildTrackKey } from "src/utils/userTrack";

type TrackYoutubeOverrideTargetFactoryOptions = Record<string, never>;

class TrackYoutubeOverrideTargetFactory extends BaseFactory<
  TrackYoutubeOverrideTarget,
  TrackYoutubeOverrideTargetFactoryOptions
> {
  build(
    attributes?: Partial<TrackYoutubeOverrideTarget>,
    _options?: TrackYoutubeOverrideTargetFactoryOptions,
  ): TrackYoutubeOverrideTarget {
    const instanceId = this.generateId();
    const trackPosition = "A1";

    const instance = {
      trackKey: `${instanceId}:${trackPosition}`,
      trackPosition,
      trackTitle: faker.music.songName(),
      instanceId,
      artist: faker.person.fullName(),
      releaseTitle: faker.music.album(),
      discogsReleaseId: faker.number.int({ min: 1, max: 999_999 }),
      initialYoutubeId: null,
      hasDefaultYoutubeEmbed: false,
      initialPreviewVideoId: null,
    } satisfies TrackYoutubeOverrideTarget;

    const factoryBuilt: TrackYoutubeOverrideTarget = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      TrackYoutubeOverrideTarget,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  unplayable(): TrackYoutubeOverrideTarget {
    return this.build({
      trackKey: "101:A2",
      trackPosition: "A2",
      trackTitle: "Second",
      instanceId: "101",
      artist: "Artist",
      releaseTitle: "Album",
      discogsReleaseId: 249504,
      initialYoutubeId: null,
      hasDefaultYoutubeEmbed: false,
      initialPreviewVideoId: null,
    });
  }

  fromReleaseTrack({
    release,
    trackPosition,
    trackTitle,
    discogsReleaseId,
    hasDefaultYoutubeEmbed = false,
    initialYoutubeId = null,
    initialPreviewVideoId = null,
  }: {
    release: DiscogsRelease;
    trackPosition: string;
    trackTitle: string;
    discogsReleaseId: number;
    hasDefaultYoutubeEmbed?: boolean;
    initialYoutubeId?: string | null;
    initialPreviewVideoId?: string | null;
  }): TrackYoutubeOverrideTarget {
    return this.build({
      trackKey: buildTrackKey(release.instance_id, trackPosition),
      trackPosition,
      trackTitle,
      instanceId: String(release.instance_id),
      artist: formatArtistNames(release),
      releaseTitle: release.basic_information.title,
      discogsReleaseId,
      initialYoutubeId,
      hasDefaultYoutubeEmbed,
      initialPreviewVideoId,
    });
  }
}

export const trackYoutubeOverrideTargetFactory =
  new TrackYoutubeOverrideTargetFactory();
