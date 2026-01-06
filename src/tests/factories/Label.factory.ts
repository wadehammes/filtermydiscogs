import { faker } from "@faker-js/faker";
import type { DiscogsLabel } from "src/types";
import { BaseFactory } from "./BaseFactory";

type LabelFactoryOptions = Record<string, never>;

class LabelFactory extends BaseFactory<DiscogsLabel, LabelFactoryOptions> {
  public build(
    attributes?: Partial<DiscogsLabel>,
    _options?: LabelFactoryOptions,
  ): DiscogsLabel {
    const instance = {
      name: faker.company.name(),
      id: faker.number.int({ min: 1, max: 999999 }),
      resource_url: `https://api.discogs.com/labels/${faker.number.int()}`,
    } satisfies DiscogsLabel;

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }
}

export const labelFactory = new LabelFactory();
