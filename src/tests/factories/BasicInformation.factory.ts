import { faker } from "@faker-js/faker";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { labelFactory } from "src/tests/factories/Label.factory";
import type { DiscogsBasicInformation } from "src/types";
import { nullish } from "src/utils/factory.helpers";

type BasicInformationFactoryOptions = {
  artistCount?: number;
  labelCount?: number;
  formatCount?: number;
  styleCount?: number;
};

const STYLE_SAMPLES = [
  "Rock",
  "Pop",
  "Electronic",
  "Jazz",
  "Hip Hop",
  "Classical",
  "Folk",
  "Country",
  "Blues",
  "Reggae",
  "Shoegaze",
  "Indie Rock",
  "Punk",
  "Metal",
] as const;

class BasicInformationFactory extends BaseFactory<
  DiscogsBasicInformation,
  BasicInformationFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsBasicInformation>,
    options?: BasicInformationFactoryOptions,
  ): DiscogsBasicInformation {
    const releaseId = faker.number.int({ min: 1, max: 999999 });
    const masterId = faker.number.int({ min: 1, max: 999999 });
    const year = faker.date.past({ years: 50 }).getFullYear();

    const instance = {
      resource_url: `https://api.discogs.com/releases/${releaseId}`,
      uri: `https://www.discogs.com/release/${releaseId}`,
      styles: faker.helpers.arrayElements(
        STYLE_SAMPLES,
        options?.styleCount ?? faker.number.int({ min: 1, max: 3 }),
      ),
      master_id: masterId,
      master_url: nullish([`https://www.discogs.com/master/${masterId}`]),
      thumb: faker.image.url({ width: 150, height: 150 }),
      cover_image: faker.image.url({ width: 600, height: 600 }),
      title: faker.music.songName(),
      year,
      formats: formatFactory.buildList(
        options?.formatCount ?? faker.number.int({ min: 1, max: 2 }),
      ),
      labels: labelFactory.buildList(
        options?.labelCount ?? faker.number.int({ min: 1, max: 2 }),
      ),
      artists: artistFactory.buildList(
        options?.artistCount ?? faker.number.int({ min: 1, max: 2 }),
      ),
    } satisfies DiscogsBasicInformation;

    const factoryBuilt: DiscogsBasicInformation = {
      ...instance,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }
}

export const basicInformationFactory = new BasicInformationFactory();
