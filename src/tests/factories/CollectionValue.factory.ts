import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { CollectionValue } from "src/types/dashboard.types";
import type { KeysMatch } from "src/types/KeysMatch";

type CollectionValueFactoryOptions = Record<string, never>;

class CollectionValueFactory extends BaseFactory<
  CollectionValue,
  CollectionValueFactoryOptions
> {
  build(
    attributes?: Partial<CollectionValue>,
    _options?: CollectionValueFactoryOptions,
  ): CollectionValue {
    const minimum = faker.number.int({ min: 1, max: 500 });
    const median = minimum + faker.number.int({ min: 1, max: 500 });
    const maximum = median + faker.number.int({ min: 1, max: 500 });

    const instance = {
      minimum,
      median,
      maximum,
    } satisfies CollectionValue;

    const factoryBuilt: CollectionValue = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      CollectionValue,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  dashboardDefaults(): CollectionValue {
    return {
      minimum: 100,
      median: 500,
      maximum: 1000,
    };
  }
}

export const collectionValueFactory = new CollectionValueFactory();
