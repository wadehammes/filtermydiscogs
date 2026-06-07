import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import type { CratesResponse, CrateWithCount } from "src/types/crate.types";
import type { KeysMatch } from "src/types/KeysMatch";

type CratesResponseFactoryOptions = {
  crateCount?: number;
};

class CratesResponseFactory extends BaseFactory<
  CratesResponse,
  CratesResponseFactoryOptions
> {
  build(
    attributes?: Partial<CratesResponse>,
    options?: CratesResponseFactoryOptions,
  ): CratesResponse {
    const crateCount =
      options?.crateCount ?? faker.number.int({ min: 0, max: 3 });

    const instance = {
      crates: crateWithCountFactory.buildList(crateCount),
    } satisfies CratesResponse;

    const factoryBuilt: CratesResponse = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      CratesResponse,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  empty(attributes: Partial<CratesResponse> = {}): CratesResponse {
    return this.build({ crates: [], ...attributes });
  }

  withCrates(
    crates: CrateWithCount[],
    attributes: Partial<CratesResponse> = {},
  ): CratesResponse {
    return this.build({ crates, ...attributes });
  }

  withCrate(
    crate: CrateWithCount,
    attributes: Partial<CratesResponse> = {},
  ): CratesResponse {
    return this.build({ crates: [crate], ...attributes });
  }
}

export const cratesResponseFactory = new CratesResponseFactory();
