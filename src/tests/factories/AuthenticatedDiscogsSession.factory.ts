import { faker } from "@faker-js/faker";
import type { AuthenticatedDiscogsSession } from "src/lib/auth-request";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

type AuthenticatedDiscogsSessionSuccess = Extract<
  AuthenticatedDiscogsSession,
  { user: unknown }
>;

type AuthenticatedDiscogsSessionFactoryOptions = Record<string, never>;

class AuthenticatedDiscogsSessionFactory extends BaseFactory<
  AuthenticatedDiscogsSessionSuccess,
  AuthenticatedDiscogsSessionFactoryOptions
> {
  build(
    attributes?: Partial<AuthenticatedDiscogsSessionSuccess>,
    _options?: AuthenticatedDiscogsSessionFactoryOptions,
  ): AuthenticatedDiscogsSessionSuccess {
    const instance = {
      user: verifiedDiscogsUserFactory.build(),
      accessToken: faker.string.alphanumeric(24),
      accessTokenSecret: faker.string.alphanumeric(24),
    } satisfies AuthenticatedDiscogsSessionSuccess;

    const factoryBuilt: AuthenticatedDiscogsSessionSuccess = {
      ...instance,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }

  forUser({
    userId = 42,
    username = "crate-digger",
    accessToken = "access-token",
    accessTokenSecret = "access-token-secret",
  }: {
    userId?: number;
    username?: string;
    accessToken?: string;
    accessTokenSecret?: string;
  } = {}): AuthenticatedDiscogsSessionSuccess {
    return this.build({
      user: { userId, username },
      accessToken,
      accessTokenSecret,
    });
  }
}

export const authenticatedDiscogsSessionFactory =
  new AuthenticatedDiscogsSessionFactory();
