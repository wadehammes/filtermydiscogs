import { faker } from "@faker-js/faker";
import type { CrateRelease, Prisma } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";
import { toPrismaJsonValue } from "src/utils/toPrismaJsonValue";

export type CrateReleaseReleaseDataFindManyRow = Prisma.CrateReleaseGetPayload<{
  select: { instance_id: true; release_data: true };
}>;

export type CrateReleaseCrateIdRow = Prisma.CrateReleaseGetPayload<{
  select: { crate_id: true };
}>;

export type CrateReleaseReleaseDataOnlyRow = Prisma.CrateReleaseGetPayload<{
  select: { release_data: true };
}>;

export type CrateReleasePreviewQueryRow = {
  crate_id: string;
  release_data: unknown;
};

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

  releaseDataFindManyRow(
    release: DiscogsRelease,
    attributes?: Partial<CrateReleaseReleaseDataFindManyRow>,
  ): CrateReleaseReleaseDataFindManyRow {
    const row: CrateReleaseReleaseDataFindManyRow = {
      instance_id: String(release.instance_id),
      release_data: toPrismaJsonValue(release),
    };

    return {
      ...row,
      ...(attributes ?? {}),
    };
  }

  crateIdFindManyRow(
    crateId: string,
    attributes?: Partial<CrateReleaseCrateIdRow>,
  ): CrateReleaseCrateIdRow {
    return {
      crate_id: crateId,
      ...attributes,
    };
  }

  releaseDataOnlyFindManyRow(
    release: DiscogsRelease,
    attributes?: Partial<CrateReleaseReleaseDataOnlyRow>,
  ): CrateReleaseReleaseDataOnlyRow {
    return {
      release_data: toPrismaJsonValue(release),
      ...attributes,
    };
  }

  previewQueryRow(
    crateId: string,
    release: DiscogsRelease,
    attributes?: Partial<CrateReleasePreviewQueryRow>,
  ): CrateReleasePreviewQueryRow {
    return {
      crate_id: crateId,
      release_data: toPrismaJsonValue(release),
      ...attributes,
    };
  }
}

export const crateReleaseFactory = new CrateReleaseFactory();
