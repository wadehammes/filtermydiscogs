import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { AdminStatsTopUserTrack } from "src/types/dashboard.types";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type AdminStatsTopUserTrackFactoryOptions = Record<string, never>;

class AdminStatsTopUserTrackFactory extends BaseFactory<
  AdminStatsTopUserTrack,
  AdminStatsTopUserTrackFactoryOptions
> {
  build(
    attributes?: Partial<AdminStatsTopUserTrack>,
    _options?: AdminStatsTopUserTrackFactoryOptions,
  ): AdminStatsTopUserTrack {
    const instance = {
      user_id: faker.number.int({ min: 1, max: 99_999 }),
      username: faker.internet.username(),
      track_key: `${faker.string.uuid()}:${faker.helpers.arrayElement(["A1", "B1"])}`,
      track_title: faker.music.songName(),
      artist: nullish([faker.person.fullName()]),
      release_title: nullish([faker.music.songName()]),
      count: faker.number.int({ min: 1, max: 50 }),
    } satisfies AdminStatsTopUserTrack;

    const factoryBuilt: AdminStatsTopUserTrack = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      AdminStatsTopUserTrack,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const adminStatsTopUserTrackFactory =
  new AdminStatsTopUserTrackFactory();
