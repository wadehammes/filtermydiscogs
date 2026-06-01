import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsArtist } from "src/types";

type ArtistFactoryOptions = Record<string, never>;

class ArtistFactory extends BaseFactory<DiscogsArtist, ArtistFactoryOptions> {
  build(
    attributes?: Partial<DiscogsArtist>,
    _options?: ArtistFactoryOptions,
  ): DiscogsArtist {
    const artistId = faker.number.int({ min: 1, max: 999999 });

    const instance = {
      name: faker.person.fullName(),
      id: artistId,
      resource_url: `https://api.discogs.com/artists/${artistId}`,
    } satisfies DiscogsArtist;

    const factoryBuilt: DiscogsArtist = {
      ...instance,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }
}

export const artistFactory = new ArtistFactory();
