import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { TopUserTrack } from "src/types/dashboard.types";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type TopUserTrackFactoryOptions = {
  release?: DiscogsRelease;
};

class TopUserTrackFactory extends BaseFactory<
  TopUserTrack,
  TopUserTrackFactoryOptions
> {
  build(
    attributes?: Partial<TopUserTrack>,
    options?: TopUserTrackFactoryOptions,
  ): TopUserTrack {
    const release = options?.release ?? releaseFactory.withDisplayDefaults();
    const instanceId = String(release.instance_id);
    const position = faker.helpers.arrayElement(["A1", "A2", "B1", "B2"]);
    const trackTitle = faker.music.songName();
    const artistName =
      release.basic_information.artists[0]?.name ?? faker.person.fullName();

    const instance = {
      track_key: `${instanceId}:${position}`,
      instance_id: instanceId,
      track_title: trackTitle,
      track_position: position,
      artist: artistName,
      release_title: release.basic_information.title,
      release_thumb: nullish([release.basic_information.thumb]),
      play_count: faker.number.int({ min: 1, max: 20 }),
      listen_count: faker.number.int({ min: 0, max: 15 }),
    } satisfies TopUserTrack;

    const factoryBuilt: TopUserTrack = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      TopUserTrack,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  fromRelease(
    release: DiscogsRelease,
    attributes: Partial<TopUserTrack> = {},
  ): TopUserTrack {
    return this.build(attributes, { release });
  }
}

export const topUserTrackFactory = new TopUserTrackFactory();
