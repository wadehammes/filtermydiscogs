import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsReleaseJson } from "src/types";

type DiscogsReleaseJsonFactoryOptions = Record<string, never>;

class DiscogsReleaseJsonFactory extends BaseFactory<
  DiscogsReleaseJson,
  DiscogsReleaseJsonFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsReleaseJson>,
    _options?: DiscogsReleaseJsonFactoryOptions,
  ): DiscogsReleaseJson {
    const releaseId = faker.number.int({ min: 1, max: 999999 });

    const factoryBuilt: DiscogsReleaseJson = {
      uri: `https://www.discogs.com/release/${releaseId}`,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }

  forReleaseId(
    releaseId: number | string,
    attributes: Partial<DiscogsReleaseJson> = {},
  ): DiscogsReleaseJson {
    return this.build({
      uri: `https://www.discogs.com/release/${releaseId}`,
      ...attributes,
    });
  }
}

export const discogsReleaseJsonFactory = new DiscogsReleaseJsonFactory();
