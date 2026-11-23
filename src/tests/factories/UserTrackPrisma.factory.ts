import { faker } from "@faker-js/faker";
import type { UserTrack } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type UserTrackPrismaFactoryOptions = {
  userId?: number;
};

class UserTrackPrismaFactory extends BaseFactory<
  UserTrack,
  UserTrackPrismaFactoryOptions
> {
  build(
    attributes?: Partial<UserTrack>,
    options?: UserTrackPrismaFactoryOptions,
  ): UserTrack {
    const userId = options?.userId ?? faker.number.int({ min: 1, max: 9999 });
    const instanceId = faker.string.numeric(4);

    const instance: UserTrack = {
      user_id: userId,
      track_key: `${instanceId}:A1`,
      youtube_id: nullish([faker.string.alphanumeric(11)]),
      track_title: faker.music.songName(),
      track_position: "A1",
      release_title: nullish([faker.music.album()]),
      artist: nullish([faker.person.fullName()]),
      instance_id: instanceId,
      discogs_release_id: nullish([
        faker.number.int({ min: 1, max: 9_999_999 }),
      ]),
      play_count: 0,
      listen_count: 0,
      last_played_at: nullish([faker.date.recent()]),
      last_listened_at: nullish([faker.date.recent()]),
      first_played_at: faker.date.past(),
      updated_at: faker.date.recent(),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<UserTrack, typeof instance> =
      undefined;

    return factoryBuilt;
  }
}

export const userTrackPrismaFactory = new UserTrackPrismaFactory();
