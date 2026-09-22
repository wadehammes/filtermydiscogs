import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { MostCratedRelease } from "src/types/dashboard.types";
import type { KeysMatch } from "src/types/KeysMatch";

type MostCratedReleaseFactoryOptions = Record<string, never>;

class MostCratedReleaseFactory extends BaseFactory<
  MostCratedRelease,
  MostCratedReleaseFactoryOptions
> {
  build(
    attributes?: Partial<MostCratedRelease>,
    _options?: MostCratedReleaseFactoryOptions,
  ): MostCratedRelease {
    const release = releaseFactory.withDisplayDefaults();

    const instance = {
      instance_id: String(release.instance_id),
      crate_count: faker.number.int({ min: 2, max: 5 }),
      release,
    } satisfies MostCratedRelease;

    const factoryBuilt: MostCratedRelease = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      MostCratedRelease,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  fromRelease(
    release: DiscogsRelease,
    attributes: Partial<Omit<MostCratedRelease, "release">> = {},
  ): MostCratedRelease {
    return this.build({
      instance_id: String(release.instance_id),
      release,
      ...attributes,
    });
  }
}

export const mostCratedReleaseFactory = new MostCratedReleaseFactory();
