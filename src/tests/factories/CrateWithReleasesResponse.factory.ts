import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { Crate, CrateWithReleasesResponse } from "src/types/crate.types";

type CrateWithReleasesResponseFactoryOptions = {
  crate?: Crate;
  releaseCount?: number;
};

class CrateWithReleasesResponseFactory extends BaseFactory<
  CrateWithReleasesResponse,
  CrateWithReleasesResponseFactoryOptions
> {
  build(
    attributes?: Partial<CrateWithReleasesResponse>,
    options?: CrateWithReleasesResponseFactoryOptions,
  ): CrateWithReleasesResponse {
    const crate = options?.crate ?? crateFactory.build();
    const releaseCount =
      options?.releaseCount ?? faker.number.int({ min: 0, max: 5 });

    const instance = {
      crate,
      releases: releaseFactory.buildList(releaseCount),
    } satisfies CrateWithReleasesResponse;

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }

  empty(
    crateAttributes: Partial<Crate> = {},
    attributes: Partial<CrateWithReleasesResponse> = {},
  ): CrateWithReleasesResponse {
    return this.build(
      {
        releases: [],
        ...attributes,
      },
      { crate: crateFactory.build(crateAttributes), releaseCount: 0 },
    );
  }

  withReleases(
    crate: Crate,
    releases: DiscogsRelease[],
    attributes: Partial<CrateWithReleasesResponse> = {},
  ): CrateWithReleasesResponse {
    return this.build({ crate, releases, ...attributes });
  }
}

export const crateWithReleasesResponseFactory =
  new CrateWithReleasesResponseFactory();
