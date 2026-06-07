import { BaseFactory } from "src/tests/factories/BaseFactory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import type { Crate } from "src/types/crate.types";
import type { KeysMatch } from "src/types/KeysMatch";

export type CreateCrateResponse = {
  crate: Crate;
};

type CreateCrateResponseFactoryOptions = Record<string, never>;

class CreateCrateResponseFactory extends BaseFactory<
  CreateCrateResponse,
  CreateCrateResponseFactoryOptions
> {
  build(
    attributes?: Partial<CreateCrateResponse>,
    _options?: CreateCrateResponseFactoryOptions,
  ): CreateCrateResponse {
    const instance = {
      crate: crateFactory.build(),
    } satisfies CreateCrateResponse;

    const factoryBuilt: CreateCrateResponse = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      CreateCrateResponse,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  forCrate(
    crate: Crate,
    attributes: Partial<CreateCrateResponse> = {},
  ): CreateCrateResponse {
    return this.build({ crate, ...attributes });
  }

  named(
    name: string,
    crateAttributes: Partial<Crate> = {},
    attributes: Partial<CreateCrateResponse> = {},
  ): CreateCrateResponse {
    return this.build({
      crate: crateFactory.named(name, crateAttributes),
      ...attributes,
    });
  }
}

export const createCrateResponseFactory = new CreateCrateResponseFactory();
