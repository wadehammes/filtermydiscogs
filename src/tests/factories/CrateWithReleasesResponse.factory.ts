import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type {
  Crate,
  CrateReleaseItem,
  CrateWithReleasesResponse,
} from "src/types/crate.types";

type CrateWithReleasesResponseFactoryOptions = {
  crate?: Crate;
  releaseCount?: number;
};

const toCrateReleaseItems = (releases: DiscogsRelease[]): CrateReleaseItem[] =>
  releases.map((release, index) => ({
    release,
    found_at: null,
    sort_order: (index + 1) * 1000,
  }));

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
      releases: toCrateReleaseItems(releaseFactory.buildList(releaseCount)),
      markers: [],
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
    return this.build(
      { crate, releases: toCrateReleaseItems(releases), ...attributes },
      { crate, releaseCount: releases.length },
    );
  }

  withReleaseItems(
    crate: Crate,
    releases: CrateReleaseItem[],
    attributes: Partial<CrateWithReleasesResponse> = {},
  ): CrateWithReleasesResponse {
    return this.build(
      { crate, releases, ...attributes },
      { crate, releaseCount: releases.length },
    );
  }
}

export const crateWithReleasesResponseFactory =
  new CrateWithReleasesResponseFactory();
