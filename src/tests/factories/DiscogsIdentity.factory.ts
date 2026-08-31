import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

export type DiscogsIdentity = {
  id: number;
  username: string;
  resource_url: string;
  consumer_name: string;
};

type DiscogsIdentityFactoryOptions = Record<string, never>;

class DiscogsIdentityFactory extends BaseFactory<
  DiscogsIdentity,
  DiscogsIdentityFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsIdentity>,
    _options?: DiscogsIdentityFactoryOptions,
  ): DiscogsIdentity {
    const id = faker.number.int({ min: 1, max: 99_999 });
    const username = faker.internet.username();

    const instance = {
      id,
      username,
      resource_url: `https://api.discogs.com/users/${username}`,
      consumer_name: faker.company.name(),
    } satisfies DiscogsIdentity;

    const factoryBuilt: DiscogsIdentity = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      DiscogsIdentity,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  forUser({
    id = 99,
    username = "verified-user",
  }: {
    id?: number;
    username?: string;
  } = {}): DiscogsIdentity {
    return this.build({ id, username });
  }
}

export const discogsIdentityFactory = new DiscogsIdentityFactory();
