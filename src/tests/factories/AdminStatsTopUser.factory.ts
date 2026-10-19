import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { AdminStatsTopUser } from "src/types/dashboard.types";
import type { KeysMatch } from "src/types/KeysMatch";

type AdminStatsTopUserFactoryOptions = Record<string, never>;

class AdminStatsTopUserFactory extends BaseFactory<
  AdminStatsTopUser,
  AdminStatsTopUserFactoryOptions
> {
  build(
    attributes?: Partial<AdminStatsTopUser>,
    _options?: AdminStatsTopUserFactoryOptions,
  ): AdminStatsTopUser {
    const instance = {
      user_id: faker.number.int({ min: 1, max: 99_999 }),
      username: faker.internet.username(),
      count: faker.number.int({ min: 1, max: 500 }),
    } satisfies AdminStatsTopUser;

    const factoryBuilt: AdminStatsTopUser = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      AdminStatsTopUser,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const adminStatsTopUserFactory = new AdminStatsTopUserFactory();
