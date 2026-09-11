import { faker } from "@faker-js/faker";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import {
  type FactoryOverrides,
  mergeFactoryAttributes,
} from "src/tests/factories/mergeFactoryAttributes";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";

type DiscogsTrackFactoryOptions = Record<string, never>;

class DiscogsTrackFactory extends BaseFactory<
  DiscogsTrack,
  DiscogsTrackFactoryOptions
> {
  build(
    attributes?: FactoryOverrides<DiscogsTrack>,
    _options?: DiscogsTrackFactoryOptions,
  ): DiscogsTrack {
    const minutes = faker.number.int({ min: 1, max: 12 });
    const seconds = faker.number.int({ min: 0, max: 59 });

    const instance: DiscogsTrack = {
      position: faker.helpers.arrayElement(["A", "A1", "A2", "B", "B1", "B2"]),
      title: faker.music.songName(),
      ...definedProps({
        duration: faker.helpers.maybe(
          () => `${minutes}:${seconds.toString().padStart(2, "0")}`,
        ),
        type_: faker.helpers.maybe(() =>
          faker.helpers.arrayElement(["track", "heading", "index"]),
        ),
        artists: faker.helpers.maybe(() => artistFactory.buildList(1)),
        extraartists: faker.helpers.maybe(() =>
          artistFactory.buildList(1).map((artist) => ({
            ...artist,
            role: faker.helpers.arrayElement([
              "Written-By",
              "Producer",
              "Remix",
            ]),
          })),
        ),
        sub_tracks: faker.helpers.maybe(() => [] as DiscogsTrack[]),
      }),
    };

    return mergeFactoryAttributes(instance, attributes);
  }

  untitled(
    attributes: FactoryOverrides<DiscogsTrack> & Pick<DiscogsTrack, "position">,
  ): DiscogsTrack {
    return this.build({
      title: "Untitled",
      type_: "track",
      ...attributes,
    });
  }
}

export const discogsTrackFactory = new DiscogsTrackFactory();
