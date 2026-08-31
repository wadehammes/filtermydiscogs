import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

export type AuthUrlParams = {
  authStatus: string | null;
  errorStatus: string | null;
};

type AuthUrlParamsFactoryOptions = Record<string, never>;

class AuthUrlParamsFactory extends BaseFactory<
  AuthUrlParams,
  AuthUrlParamsFactoryOptions
> {
  build(
    attributes?: Partial<AuthUrlParams>,
    _options?: AuthUrlParamsFactoryOptions,
  ): AuthUrlParams {
    const instance = {
      authStatus: faker.helpers.arrayElement([null, "success", "error"]),
      errorStatus: faker.helpers.arrayElement([
        null,
        "access_denied",
        "oauth_failed",
      ]),
    } satisfies AuthUrlParams;

    const factoryBuilt: AuthUrlParams = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      AuthUrlParams,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  empty(): AuthUrlParams {
    return {
      authStatus: null,
      errorStatus: null,
    };
  }

  authSuccess(): AuthUrlParams {
    return {
      authStatus: "success",
      errorStatus: null,
    };
  }

  authError(errorStatus: string): AuthUrlParams {
    return {
      authStatus: null,
      errorStatus,
    };
  }
}

export const authUrlParamsFactory = new AuthUrlParamsFactory();
