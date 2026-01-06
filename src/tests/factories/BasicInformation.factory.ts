import { faker } from "@faker-js/faker";
import type { DiscogsBasicInformation } from "src/types";
import { artistFactory } from "./Artist.factory";
import { BaseFactory } from "./BaseFactory";
import { formatFactory } from "./Format.factory";
import { labelFactory } from "./Label.factory";

type BasicInformationFactoryOptions = {
  artistCount?: number;
  labelCount?: number;
  formatCount?: number;
  styleCount?: number;
};

class BasicInformationFactory extends BaseFactory<
  DiscogsBasicInformation,
  BasicInformationFactoryOptions
> {
  public build(
    attributes?: Partial<DiscogsBasicInformation>,
    options?: BasicInformationFactoryOptions,
  ): DiscogsBasicInformation {
    const releaseId = faker.number.int({ min: 1, max: 999999 });
    const masterId = faker.number.int({ min: 1, max: 999999 });
    const year = faker.date.past({ years: 50 }).getFullYear();

    const styles = [
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
    ];

    const instance = {
      resource_url: `https://api.discogs.com/releases/${releaseId}`,
      uri: `https://www.discogs.com/release/${releaseId}`,
      styles: faker.helpers.arrayElements(
        styles,
        options?.styleCount ?? faker.number.int({ min: 1, max: 3 }),
      ),
      master_id: masterId,
      master_url: `https://www.discogs.com/master/${masterId}`,
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

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }
}

export const basicInformationFactory = new BasicInformationFactory();
