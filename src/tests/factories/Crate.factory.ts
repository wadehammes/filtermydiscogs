import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { Crate } from "src/types/crate.types";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type CrateFactoryOptions = {
  userId?: number;
  isDefault?: boolean;
};

const CRATE_NAME_SAMPLES = [
  "My Crate",
  "Favorites",
  "Wantlist",
  "Collection",
] as const;

class CrateFactory extends BaseFactory<Crate, CrateFactoryOptions> {
  build(attributes?: Partial<Crate>, options?: CrateFactoryOptions): Crate {
    const userId =
      options?.userId ?? faker.number.int({ min: 100000, max: 999999 });
    const isDefault = options?.isDefault ?? false;

    const instance = {
      user_id: userId,
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        ...CRATE_NAME_SAMPLES,
        faker.word.noun(),
      ]),
      username: nullish([faker.internet.username()]),
      is_default: isDefault,
      private: faker.datatype.boolean(),
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    } satisfies Crate;

    const factoryBuilt: Crate = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<Crate, typeof instance> =
      undefined;

    return factoryBuilt;
  }
}

export const crateFactory = new CrateFactory();
