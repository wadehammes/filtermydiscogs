import { faker } from "@faker-js/faker";
import type { PublicPlaylistRow } from "src/lib/public-playlist-query.server";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type PublicPlaylistRowFactoryOptions = Record<string, never>;

class PublicPlaylistRowFactory extends BaseFactory<
  PublicPlaylistRow,
  PublicPlaylistRowFactoryOptions
> {
  build(
    attributes?: Partial<PublicPlaylistRow>,
    _options?: PublicPlaylistRowFactoryOptions,
  ): PublicPlaylistRow {
    const created = faker.date.past();
    const updated = faker.date.between({ from: created, to: new Date() });

    const base: PublicPlaylistRow = {
      user_id: faker.number.int({ min: 1, max: 9999 }),
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Public mix",
        "Sunday spins",
        faker.word.noun(),
      ]),
      username: nullish([faker.internet.username()]),
      private: false,
      public_view_count: 0,
      public_play_count: 0,
      public_description: null,
      created_at: created,
      updated_at: updated,
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      PublicPlaylistRow,
      typeof base
    > = undefined;

    return mergeFactoryAttributes(base, attributes);
  }

  forSharedLoadTest(
    attributes: Partial<PublicPlaylistRow> = {},
  ): PublicPlaylistRow {
    return this.build({
      user_id: 123,
      id: "11111111-2222-3333-4444-555555555555",
      name: "Shared",
      username: "dj",
      private: false,
      public_description: null,
      public_view_count: 0,
      public_play_count: 0,
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-02T00:00:00.000Z"),
      ...attributes,
    });
  }
}

export const publicPlaylistRowFactory = new PublicPlaylistRowFactory();
