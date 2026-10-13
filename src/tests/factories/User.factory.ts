import { faker } from "@faker-js/faker";
import type { User } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import type { KeysMatch } from "src/types/KeysMatch";
import type { UserPreferencesJson } from "src/types/userPreferences.types";
import { toPrismaJsonValue } from "src/utils/toPrismaJsonValue";

type PrismaUserFactoryOptions = {
  userId?: number;
  username?: string;
};

class PrismaUserFactory extends BaseFactory<User, PrismaUserFactoryOptions> {
  build(attributes?: Partial<User>, options?: PrismaUserFactoryOptions): User {
    const discogs_user_id =
      options?.userId ?? faker.number.int({ min: 1, max: 999_999 });
    const username = options?.username ?? faker.internet.username();

    const instance = {
      discogs_user_id,
      username,
      preferences: toPrismaJsonValue(
        userPreferencesFactory.defaults(),
      ) as UserPreferencesJson,
      login_count: 0,
      support_toast_dismissed: false,
      support_toast_pending: false,
      last_seen_at: null,
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    } satisfies User;

    const factoryBuilt: User = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<User, typeof instance> =
      undefined;

    return factoryBuilt;
  }
}

export const prismaUserFactory = new PrismaUserFactory();
