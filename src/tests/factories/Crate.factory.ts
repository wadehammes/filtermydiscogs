import { faker } from "@faker-js/faker";
import type { Crate } from "src/types/crate.types";
import { BaseFactory } from "./BaseFactory";

type CrateFactoryOptions = {
  userId?: number;
  isDefault?: boolean;
};

class CrateFactory extends BaseFactory<Crate, CrateFactoryOptions> {
  public build(
    attributes?: Partial<Crate>,
    options?: CrateFactoryOptions,
  ): Crate {
    const userId =
      options?.userId ?? faker.number.int({ min: 100000, max: 999999 });
    const isDefault = options?.isDefault ?? false;

    const instance = {
      user_id: userId,
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "My Crate",
        "Favorites",
        "Wantlist",
        "Collection",
        faker.word.noun(),
      ]),
      username: null,
      is_default: isDefault,
      private: true,
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    } satisfies Crate;

    return {
      ...instance,
      ...(attributes ?? {}),
    } as Crate;
  }
}

export const crateFactory = new CrateFactory();
