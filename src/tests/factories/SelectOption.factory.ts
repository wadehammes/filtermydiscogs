import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";

export type SelectOption = {
  value: string;
  label: string;
  isDefault?: boolean;
};

class SelectOptionFactory extends BaseFactory<
  SelectOption,
  Record<string, never>
> {
  build(attributes?: Partial<SelectOption>): SelectOption {
    const instance = {
      value: faker.string.alphanumeric(8),
      label: faker.word.words({ count: { min: 1, max: 3 } }),
    } satisfies SelectOption;

    const factoryBuilt: SelectOption = {
      ...instance,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }
}

export const selectOptionFactory = new SelectOptionFactory();

export const defaultSelectOptions = (): SelectOption[] => [
  selectOptionFactory.build({ value: "option1", label: "Option 1" }),
  selectOptionFactory.build({ value: "option2", label: "Option 2" }),
  selectOptionFactory.build({ value: "option3", label: "Option 3" }),
];
