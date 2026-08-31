import { faker } from "@faker-js/faker";
import type {
  VerifiedDiscogsUser,
  VerifiedUserResult,
} from "src/lib/auth-request";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

type VerifiedDiscogsUserFactoryOptions = Record<string, never>;

class VerifiedDiscogsUserFactory extends BaseFactory<
  VerifiedDiscogsUser,
  VerifiedDiscogsUserFactoryOptions
> {
  build(
    attributes?: Partial<VerifiedDiscogsUser>,
    _options?: VerifiedDiscogsUserFactoryOptions,
  ): VerifiedDiscogsUser {
    const instance = {
      userId: faker.number.int({ min: 1, max: 99_999 }),
      username: faker.internet.username(),
    } satisfies VerifiedDiscogsUser;

    const factoryBuilt: VerifiedDiscogsUser = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      VerifiedDiscogsUser,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  defaults(attributes: Partial<VerifiedDiscogsUser> = {}): VerifiedDiscogsUser {
    return this.build({
      userId: 123,
      username: "testuser",
      ...attributes,
    });
  }

  asVerifiedResult(
    attributes: Partial<VerifiedDiscogsUser> = {},
  ): Extract<VerifiedUserResult, { user: VerifiedDiscogsUser }> {
    return {
      user: this.build(attributes),
    };
  }
}

export const verifiedDiscogsUserFactory = new VerifiedDiscogsUserFactory();
