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
    const userId = options?.userId ?? 123;
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

  defaultTestCrate(attributes: Partial<Crate> = {}): Crate {
    return this.build({
      id: "crate-1",
      is_default: true,
      user_id: 123,
      ...attributes,
    });
  }

  named(name: string, attributes: Partial<Crate> = {}): Crate {
    return this.build({
      id: "new-crate",
      name,
      user_id: 123,
      ...attributes,
    });
  }
}

export const crateFactory = new CrateFactory();
