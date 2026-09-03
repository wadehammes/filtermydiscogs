import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { ReleaseCrateMembershipResponse } from "src/types/crate.types";
import type { KeysMatch } from "src/types/KeysMatch";

type ReleaseCrateMembershipResponseFactoryOptions = Record<string, never>;

class ReleaseCrateMembershipResponseFactory extends BaseFactory<
  ReleaseCrateMembershipResponse,
  ReleaseCrateMembershipResponseFactoryOptions
> {
  build(
    attributes?: Partial<ReleaseCrateMembershipResponse>,
    _options?: ReleaseCrateMembershipResponseFactoryOptions,
  ): ReleaseCrateMembershipResponse {
    const instance = {
      crateIds: [],
    } satisfies ReleaseCrateMembershipResponse;

    const factoryBuilt: ReleaseCrateMembershipResponse = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      ReleaseCrateMembershipResponse,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const releaseCrateMembershipResponseFactory =
  new ReleaseCrateMembershipResponseFactory();
