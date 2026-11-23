import { faker } from "@faker-js/faker";
import type { CrateSetMarker } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type CrateSetMarkerFactoryOptions = {
  userId?: number;
  crateId?: string;
};

class CrateSetMarkerFactory extends BaseFactory<
  CrateSetMarker,
  CrateSetMarkerFactoryOptions
> {
  build(
    attributes?: Partial<CrateSetMarker>,
    options?: CrateSetMarkerFactoryOptions,
  ): CrateSetMarker {
    const userId = options?.userId ?? faker.number.int({ min: 1, max: 9999 });
    const crateId = options?.crateId ?? faker.string.uuid();

    const instance: CrateSetMarker = {
      user_id: userId,
      crate_id: crateId,
      id: faker.string.uuid(),
      label: faker.word.noun(),
      sort_order: faker.number.int({ min: 1000, max: 10_000 }),
      parent_id: nullish([faker.string.uuid()]),
      accent_key: nullish([faker.color.human()]),
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      CrateSetMarker,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const crateSetMarkerFactory = new CrateSetMarkerFactory();
