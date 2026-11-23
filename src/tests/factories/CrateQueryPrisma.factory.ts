import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";

export type CrateIdRow = Prisma.CrateGetPayload<{
  select: { id: true };
}>;

type CrateQueryPrismaFactoryOptions = Record<string, never>;

class CrateIdRowFactory extends BaseFactory<
  CrateIdRow,
  CrateQueryPrismaFactoryOptions
> {
  build(
    attributes?: Partial<CrateIdRow>,
    _options?: CrateQueryPrismaFactoryOptions,
  ): CrateIdRow {
    const instance: CrateIdRow = {
      id: faker.string.uuid(),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<CrateIdRow, typeof instance> =
      undefined;

    return factoryBuilt;
  }
}

export const crateIdRowFactory = new CrateIdRowFactory();
