import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

export type CrateMutationSuccess = {
  success: boolean;
};

export type SyncCratesSuccess = CrateMutationSuccess & {
  removedCount: number;
};

export type ClearPackedSuccess = CrateMutationSuccess & {
  cleared_count: number;
};

type CrateMutationSuccessFactoryOptions = Record<string, never>;

class CrateMutationSuccessFactory extends BaseFactory<
  CrateMutationSuccess,
  CrateMutationSuccessFactoryOptions
> {
  build(
    attributes?: Partial<CrateMutationSuccess>,
    _options?: CrateMutationSuccessFactoryOptions,
  ): CrateMutationSuccess {
    const instance = {
      success: true,
    } satisfies CrateMutationSuccess;

    const factoryBuilt: CrateMutationSuccess = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      CrateMutationSuccess,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  sync(removedCount = faker.number.int({ min: 0, max: 5 })): SyncCratesSuccess {
    return {
      ...this.build(),
      removedCount,
    };
  }

  clearPacked(clearedCount = 1): ClearPackedSuccess {
    return {
      ...this.build(),
      cleared_count: clearedCount,
    };
  }
}

export const crateMutationSuccessFactory = new CrateMutationSuccessFactory();
