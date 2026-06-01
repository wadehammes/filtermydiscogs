import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsFormat } from "src/types";

type FormatFactoryOptions = Record<string, never>;

const FORMAT_NAMES = [
  "Vinyl",
  "LP",
  '12"',
  '7"',
  "CD",
  "Cassette",
  "Digital",
  "File",
] as const;

const FORMAT_DESCRIPTIONS = [
  "Album",
  "EP",
  "Single",
  "Compilation",
  "Remastered",
  "Limited Edition",
] as const;

class FormatFactory extends BaseFactory<DiscogsFormat, FormatFactoryOptions> {
  build(
    attributes?: Partial<DiscogsFormat>,
    _options?: FormatFactoryOptions,
  ): DiscogsFormat {
    const instance = {
      name: faker.helpers.arrayElement(FORMAT_NAMES),
      qty: faker.helpers.arrayElement(["1", "2", "3"]),
      descriptions: faker.helpers.arrayElements(FORMAT_DESCRIPTIONS, {
        min: 1,
        max: 3,
      }),
    } satisfies DiscogsFormat;

    const factoryBuilt: DiscogsFormat = {
      ...instance,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }
}

export const formatFactory = new FormatFactory();
