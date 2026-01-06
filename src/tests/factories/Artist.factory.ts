import { faker } from "@faker-js/faker";
import type { DiscogsArtist } from "src/types";
import { BaseFactory } from "./BaseFactory";

type ArtistFactoryOptions = Record<string, never>;

class ArtistFactory extends BaseFactory<DiscogsArtist, ArtistFactoryOptions> {
  public build(
    attributes?: Partial<DiscogsArtist>,
    _options?: ArtistFactoryOptions,
  ): DiscogsArtist {
    const instance = {
      name: faker.person.fullName(),
      id: faker.number.int({ min: 1, max: 999999 }),
      resource_url: `https://api.discogs.com/artists/${faker.number.int()}`,
    } satisfies DiscogsArtist;

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }
}

export const artistFactory = new ArtistFactory();
