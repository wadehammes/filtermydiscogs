import { faker } from "@faker-js/faker";
import type { DiscogsRelease } from "src/types";
import { BaseFactory } from "./BaseFactory";
import { releaseFactory } from "./Release.factory";

type CrateReleaseFactoryOptions = {
  userId?: number;
  crateId?: string;
  instanceId?: string;
};

interface CrateRelease {
  user_id: number;
  crate_id: string;
  instance_id: string;
  release_data: DiscogsRelease;
  added_at: Date;
}

class CrateReleaseFactory extends BaseFactory<
  CrateRelease,
  CrateReleaseFactoryOptions
> {
  public build(
    attributes?: Partial<CrateRelease>,
    options?: CrateReleaseFactoryOptions,
  ): CrateRelease {
    const userId =
      options?.userId ?? faker.number.int({ min: 100000, max: 999999 });
    const crateId = options?.crateId ?? faker.string.uuid();
    const instanceId = options?.instanceId ?? faker.string.uuid();
    const release = releaseFactory.build({ instance_id: instanceId });

    const instance = {
      user_id: userId,
      crate_id: crateId,
      instance_id: instanceId,
      release_data: release as unknown as DiscogsRelease,
      added_at: faker.date.past(),
    } satisfies CrateRelease;

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }
}

export const crateReleaseFactory = new CrateReleaseFactory();
