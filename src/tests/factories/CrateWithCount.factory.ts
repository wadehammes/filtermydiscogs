import { BaseFactory } from "src/tests/factories/BaseFactory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import type { Crate } from "src/types/crate.types";

export type CrateWithCount = Crate & { releaseCount: number };

type CrateWithCountFactoryOptions = {
  releaseCount?: number;
};

class CrateWithCountFactory extends BaseFactory<
  CrateWithCount,
  CrateWithCountFactoryOptions
> {
  build(
    attributes?: Partial<CrateWithCount>,
    options?: CrateWithCountFactoryOptions,
  ): CrateWithCount {
    const { releaseCount, ...crateAttributes } = attributes ?? {};
    const count = releaseCount ?? options?.releaseCount ?? 0;

    return {
      ...crateFactory.build(crateAttributes),
      releaseCount: count,
    };
  }
}

const crateWithCountFactory = new CrateWithCountFactory();

export const defaultCrateSelectorCrates = (): CrateWithCount[] => [
  crateWithCountFactory.build({
    id: "1",
    name: "Crate 1",
    is_default: true,
    releaseCount: 5,
  }),
  crateWithCountFactory.build({
    id: "2",
    name: "Crate 2",
    is_default: false,
    releaseCount: 3,
  }),
  crateWithCountFactory.build({
    id: "3",
    name: "Crate 3",
    is_default: false,
    releaseCount: 0,
  }),
];
