import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import {
  type FactoryOverrides,
  mergeFactoryAttributes,
} from "src/tests/factories/mergeFactoryAttributes";
import type { DiscogsVideo } from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";

type DiscogsVideoFactoryOptions = Record<string, never>;

const buildYoutubeWatchUri = (
  videoId = faker.string.alphanumeric(11),
): string => `https://www.youtube.com/watch?v=${videoId}`;

class DiscogsVideoFactory extends BaseFactory<
  DiscogsVideo,
  DiscogsVideoFactoryOptions
> {
  build(
    attributes?: FactoryOverrides<DiscogsVideo>,
    _options?: DiscogsVideoFactoryOptions,
  ): DiscogsVideo {
    const title = faker.music.songName();

    const instance: DiscogsVideo = {
      uri: buildYoutubeWatchUri(),
      title,
      ...definedProps({
        description: faker.helpers.maybe(() => title),
        duration: faker.helpers.maybe(() =>
          faker.number.int({ min: 30, max: 600 }),
        ),
        embed: faker.helpers.maybe(() => faker.datatype.boolean()),
      }),
    };

    return mergeFactoryAttributes(instance, attributes);
  }

  youtube(attributes: FactoryOverrides<DiscogsVideo> = {}): DiscogsVideo {
    const { uri, ...rest } = attributes;

    return this.build({
      uri: uri ?? buildYoutubeWatchUri(),
      embed: true,
      ...rest,
    });
  }

  nonYoutube(attributes: FactoryOverrides<DiscogsVideo> = {}): DiscogsVideo {
    const releaseId = faker.number.int({ min: 1, max: 999999 });

    return this.build({
      uri: `https://www.discogs.com/release/${releaseId}`,
      embed: true,
      ...attributes,
    });
  }
}

export const discogsVideoFactory = new DiscogsVideoFactory();
