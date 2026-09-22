import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

export type MutationSuccess = {
  success: boolean;
};

type MutationSuccessFactoryOptions = Record<string, never>;

class MutationSuccessFactory extends BaseFactory<
  MutationSuccess,
  MutationSuccessFactoryOptions
> {
  build(
    attributes?: Partial<MutationSuccess>,
    _options?: MutationSuccessFactoryOptions,
  ): MutationSuccess {
    const instance = {
      success: true,
    } satisfies MutationSuccess;

    const factoryBuilt: MutationSuccess = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      MutationSuccess,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const mutationSuccessFactory = new MutationSuccessFactory();
