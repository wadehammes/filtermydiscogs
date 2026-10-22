import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { nullish } from "src/utils/factory.helpers";

type PlaylistTrackRowFactoryOptions = Record<string, never>;

class PlaylistTrackRowFactory extends BaseFactory<
  PlaylistTrackRow,
  PlaylistTrackRowFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistTrackRow>,
    _options?: PlaylistTrackRowFactoryOptions,
  ): PlaylistTrackRow {
    const instanceId = faker.string.numeric({ length: 4 });
    const position = faker.helpers.arrayElement(["A1", "A2", "B1"]);

    const instance: PlaylistTrackRow = {
      track_key: `${instanceId}:${position}`,
      sort_order: faker.number.int({ min: 1, max: 50 }),
      track_title: faker.music.songName(),
      track_position: position,
      instance_id: instanceId,
      artist: nullish([faker.person.fullName()]),
      release_title: nullish([faker.music.album()]),
      youtube_id: nullish(["dQw4w9WgXcQ"]),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistTrackRow,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  opening(attributes: Partial<PlaylistTrackRow> = {}): PlaylistTrackRow {
    return this.build({
      track_key: "9001:A1",
      sort_order: 1,
      track_title: "Opening",
      track_position: "A1",
      instance_id: "9001",
      artist: "Test Artist",
      release_title: "Test Album",
      youtube_id: "dQw4w9WgXcQ",
      ...attributes,
    });
  }
}

export const playlistTrackRowFactory = new PlaylistTrackRowFactory();
