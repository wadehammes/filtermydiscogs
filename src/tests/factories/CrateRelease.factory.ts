import { faker } from "@faker-js/faker";
import type { CrateRelease } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";
import { toPrismaJsonValue } from "src/utils/toPrismaJsonValue";

type CrateReleaseFactoryOptions = {
  userId?: number;
  crateId?: string;
};

class CrateReleaseFactory extends BaseFactory<
  CrateRelease,
  CrateReleaseFactoryOptions
> {
  build(
    attributes?: Partial<CrateRelease>,
    options?: CrateReleaseFactoryOptions,
  ): CrateRelease {
    const userId = options?.userId ?? 123;
    const crateId = options?.crateId ?? "crate-1";
    const release = releaseFactory.withDisplayDefaults();

    const instance = {
      user_id: userId,
      crate_id: crateId,
      instance_id: release.instance_id,
      release_data: toPrismaJsonValue(release),
      added_at: faker.date.past(),
      found_at: nullish([faker.date.recent()]),
      sort_order: faker.number.int({ min: 1000, max: 10_000 }),
      section_id: null,
    } satisfies CrateRelease;

    const factoryBuilt: CrateRelease = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      CrateRelease,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  forInstance(
    instanceId: string,
    attributes: Partial<CrateRelease> = {},
    options?: CrateReleaseFactoryOptions,
  ): CrateRelease {
    return this.build({ instance_id: instanceId, ...attributes }, options);
  }

  fromDiscogsRelease(
    release: DiscogsRelease,
    attributes: Partial<CrateRelease> = {},
    options?: CrateReleaseFactoryOptions,
  ): CrateRelease {
    return this.build(
      {
        instance_id: release.instance_id,
        release_data: toPrismaJsonValue(release),
        ...attributes,
      },
      options,
    );
  }
}

export const crateReleaseFactory = new CrateReleaseFactory();
