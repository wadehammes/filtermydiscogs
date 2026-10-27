import { faker } from "@faker-js/faker";
import { LOGIN_DEMO_PUBLIC_PLAYLIST_ID } from "src/constants/publicPlaylist.constants";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import type { PublicPlaylistInfo } from "src/types/playlist.types";
import { nullish } from "src/utils/factory.helpers";

type PublicPlaylistInfoFactoryOptions = Record<string, never>;

class PublicPlaylistInfoFactory extends BaseFactory<
  PublicPlaylistInfo,
  PublicPlaylistInfoFactoryOptions
> {
  build(
    attributes?: Partial<PublicPlaylistInfo>,
    _options?: PublicPlaylistInfoFactoryOptions,
  ): PublicPlaylistInfo {
    const created = faker.date.past();
    const updated = faker.date.between({ from: created, to: new Date() });

    const instance: PublicPlaylistInfo = {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Weekend rotation",
        "Public mix",
        faker.word.noun(),
      ]),
      username: nullish([faker.internet.username()]),
      private: false,
      publicDescription: null,
      created_at: created.toISOString(),
      updated_at: updated.toISOString(),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PublicPlaylistInfo,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  forDemoPage(
    attributes: Partial<PublicPlaylistInfo> = {},
  ): PublicPlaylistInfo {
    return this.build({
      id: LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
      username: "collector",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
      ...attributes,
    });
  }
}

export const publicPlaylistInfoFactory = new PublicPlaylistInfoFactory();
