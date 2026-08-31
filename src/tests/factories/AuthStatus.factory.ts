import { faker } from "@faker-js/faker";
import type { AuthStatus } from "src/services/auth.service";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type AuthStatusFactoryOptions = Record<string, never>;

class AuthStatusFactory extends BaseFactory<
  AuthStatus,
  AuthStatusFactoryOptions
> {
  build(
    attributes?: Partial<AuthStatus>,
    _options?: AuthStatusFactoryOptions,
  ): AuthStatus {
    const instance = {
      isAuthenticated: faker.datatype.boolean(),
      username: nullish([faker.internet.username()]),
      userId: nullish([faker.number.int({ min: 1, max: 99_999 }).toString()]),
      reconnectUsername: nullish([faker.internet.username()]),
      rateLimited: faker.datatype.boolean(),
      showSupportProjectToast: faker.datatype.boolean(),
    } satisfies AuthStatus;

    const factoryBuilt: AuthStatus = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<AuthStatus, typeof instance> =
      undefined;

    return factoryBuilt;
  }

  authenticated(attributes: Partial<AuthStatus> = {}): AuthStatus {
    return this.build({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      reconnectUsername: null,
      rateLimited: false,
      showSupportProjectToast: false,
      ...attributes,
    });
  }

  unauthenticated(attributes: Partial<AuthStatus> = {}): AuthStatus {
    return this.build({
      isAuthenticated: false,
      username: null,
      userId: null,
      reconnectUsername: null,
      rateLimited: false,
      showSupportProjectToast: false,
      ...attributes,
    });
  }
}

export const authStatusFactory = new AuthStatusFactory();
