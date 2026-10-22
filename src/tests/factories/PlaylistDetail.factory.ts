import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import type { KeysMatch } from "src/types/KeysMatch";
import type { PlaylistDetail } from "src/types/playlist.types";

type PlaylistDetailFactoryOptions = {
  trackCount?: number;
};

class PlaylistDetailFactory extends BaseFactory<
  PlaylistDetail,
  PlaylistDetailFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistDetail>,
    options?: PlaylistDetailFactoryOptions,
  ): PlaylistDetail {
    const created = faker.date.past();
    const trackCount = options?.trackCount ?? 2;

    const instance = {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Sunday spins",
        "Late night",
        faker.word.noun(),
      ]),
      created_at: created.toISOString(),
      updated_at: faker.date
        .between({ from: created, to: new Date() })
        .toISOString(),
      tracks: playlistTrackRowFactory.buildList(trackCount),
    } satisfies PlaylistDetail;

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistDetail,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  withTracks(
    tracks: PlaylistDetail["tracks"],
    attributes: Partial<PlaylistDetail> = {},
  ): PlaylistDetail {
    return this.build({ tracks, ...attributes }, { trackCount: tracks.length });
  }
}

export const playlistDetailFactory = new PlaylistDetailFactory();
