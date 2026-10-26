import { faker } from "@faker-js/faker";
import type { PublicCrateRow } from "src/lib/public-crate-query.server";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import { nullish } from "src/utils/factory.helpers";

type PublicCrateRowFactoryOptions = Record<string, never>;

class PublicCrateRowFactory extends BaseFactory<
  PublicCrateRow,
  PublicCrateRowFactoryOptions
> {
  build(
    attributes?: Partial<PublicCrateRow>,
    _options?: PublicCrateRowFactoryOptions,
  ): PublicCrateRow {
    const created = faker.date.past();
    const updated = faker.date.between({ from: created, to: new Date() });

    const base: PublicCrateRow = {
      user_id: faker.number.int({ min: 1, max: 9999 }),
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Public crate",
        "Floor fillers",
        faker.word.noun(),
      ]),
      username: nullish([faker.internet.username()]),
      is_default: false,
      private: false,
      created_at: created,
      updated_at: updated,
    };

    const _allKeysMustBeInTheInstance: KeysMatch<PublicCrateRow, typeof base> =
      undefined;

    return mergeFactoryAttributes(base, attributes);
  }
}

export const publicCrateRowFactory = new PublicCrateRowFactory();
