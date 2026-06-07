import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import type { Crate } from "src/types/crate.types";
import type { KeysMatch } from "src/types/KeysMatch";

export type CrateWithCount = Crate & { releaseCount: number };

type CrateWithCountFactoryOptions = {
  releaseCount?: number;
};

class CrateWithCountFactory extends BaseFactory<
  CrateWithCount,
  CrateWithCountFactoryOptions
> {
  build(
    attributes?: Partial<CrateWithCount>,
    options?: CrateWithCountFactoryOptions,
  ) {
    const { releaseCount: releaseCountOverride, ...crateAttributes } =
      attributes ?? {};
    const count =
      releaseCountOverride ??
      options?.releaseCount ??
      faker.number.int({ min: 0, max: 50 });

    const instance = {
      ...crateFactory.build(crateAttributes),
      releaseCount: count,
    } satisfies CrateWithCount;

    const factoryBuilt: CrateWithCount = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      CrateWithCount,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  fromCrate(
    crate: Crate,
    attributes: Partial<CrateWithCount> = {},
  ): CrateWithCount {
    const { releaseCount = 0, ...crateAttributes } = attributes;
    return this.build({
      ...crate,
      releaseCount,
      ...crateAttributes,
    });
  }

  defaultTestCrate(attributes: Partial<CrateWithCount> = {}): CrateWithCount {
    return this.build({
      id: "crate-1",
      is_default: true,
      user_id: 123,
      releaseCount: 0,
      ...attributes,
    });
  }

  defaultCrateSelectorCrates(): CrateWithCount[] {
    return [
      this.build({
        id: "1",
        name: "Crate 1",
        is_default: true,
        releaseCount: 5,
      }),
      this.build({
        id: "2",
        name: "Crate 2",
        is_default: false,
        releaseCount: 3,
      }),
      this.build({
        id: "3",
        name: "Crate 3",
        is_default: false,
        releaseCount: 0,
      }),
    ];
  }
}

export const crateWithCountFactory = new CrateWithCountFactory();
