import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

export type SelectOptionFactoryType = {
  value: string;
  label: string;
  isDefault?: boolean;
};

type SelectOptionFactoryOptions = Record<string, never>;

class SelectOptionFactory extends BaseFactory<
  SelectOptionFactoryType,
  SelectOptionFactoryOptions
> {
  build(
    attributes?: Partial<SelectOptionFactoryType>,
    _options?: SelectOptionFactoryOptions,
  ) {
    const instance = {
      value: faker.string.alphanumeric(8),
      label: faker.word.words({ count: { min: 1, max: 3 } }),
      ...(faker.datatype.boolean({ probability: 0.2 }) && { isDefault: true }),
    } satisfies SelectOptionFactoryType;

    const factoryBuilt: SelectOptionFactoryType = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      SelectOptionFactoryType,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const selectOptionFactory = new SelectOptionFactory();

export const defaultSelectOptions = (): SelectOptionFactoryType[] => [
  selectOptionFactory.build({ value: "option1", label: "Option 1" }),
  selectOptionFactory.build({ value: "option2", label: "Option 2" }),
  selectOptionFactory.build({ value: "option3", label: "Option 3" }),
];
