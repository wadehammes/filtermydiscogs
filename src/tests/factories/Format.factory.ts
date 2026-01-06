import { faker } from "@faker-js/faker";
import type { DiscogsFormat } from "src/types";
import { BaseFactory } from "./BaseFactory";

type FormatFactoryOptions = Record<string, never>;

class FormatFactory extends BaseFactory<DiscogsFormat, FormatFactoryOptions> {
  public build(
    attributes?: Partial<DiscogsFormat>,
    _options?: FormatFactoryOptions,
  ): DiscogsFormat {
    const formatNames = [
      "Vinyl",
      "LP",
      '12"',
      '7"',
      "CD",
      "Cassette",
      "Digital",
      "File",
    ];

    const instance = {
      name: faker.helpers.arrayElement(formatNames),
      qty: faker.helpers.arrayElement(["1", "2", "3"]),
      descriptions: faker.helpers.arrayElements([
        "Album",
        "EP",
        "Single",
        "Compilation",
        "Remastered",
        "Limited Edition",
      ]),
    } satisfies DiscogsFormat;

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }
}

export const formatFactory = new FormatFactory();
