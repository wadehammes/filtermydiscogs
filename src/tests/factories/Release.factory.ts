import { faker } from "@faker-js/faker";
import type { DiscogsRelease } from "src/types";
import { BaseFactory } from "./BaseFactory";
import { basicInformationFactory } from "./BasicInformation.factory";

type ReleaseFactoryOptions = {
  artistCount?: number;
  labelCount?: number;
  formatCount?: number;
  styleCount?: number;
};

class ReleaseFactory extends BaseFactory<
  DiscogsRelease,
  ReleaseFactoryOptions
> {
  public build(
    attributes?: Partial<DiscogsRelease>,
    options?: ReleaseFactoryOptions,
  ): DiscogsRelease {
    const instance = {
      instance_id: faker.string.uuid(),
      date_added: faker.date.past().toISOString(),
      rating: faker.number.int({ min: 0, max: 5 }),
      basic_information: basicInformationFactory.build(
        {},
        {
          ...(options?.artistCount !== undefined && {
            artistCount: options.artistCount,
          }),
          ...(options?.labelCount !== undefined && {
            labelCount: options.labelCount,
          }),
          ...(options?.formatCount !== undefined && {
            formatCount: options.formatCount,
          }),
          ...(options?.styleCount !== undefined && {
            styleCount: options.styleCount,
          }),
        },
      ),
      notes: [],
    } satisfies DiscogsRelease;

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }
}

export const releaseFactory = new ReleaseFactory();
