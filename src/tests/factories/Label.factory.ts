import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsLabel } from "src/types";

type LabelFactoryOptions = Record<string, never>;

class LabelFactory extends BaseFactory<DiscogsLabel, LabelFactoryOptions> {
  build(
    attributes?: Partial<DiscogsLabel>,
    _options?: LabelFactoryOptions,
  ): DiscogsLabel {
    const labelId = faker.number.int({ min: 1, max: 999999 });

    const instance = {
      name: faker.company.name(),
      id: labelId,
      resource_url: `https://api.discogs.com/labels/${labelId}`,
    } satisfies DiscogsLabel;

    const factoryBuilt: DiscogsLabel = {
      ...instance,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }
}

export const labelFactory = new LabelFactory();
