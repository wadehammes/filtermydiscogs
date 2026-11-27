export type FilterSelectOption = {
  value: string;
  label: string;
};

export const withSelectedFilterSelectOptions = (
  available: readonly string[],
  selected: readonly string[],
): FilterSelectOption[] => {
  const seen = new Set<string>();
  const options: FilterSelectOption[] = [];

  const pushOption = (value: string) => {
    if (seen.has(value)) {
      return;
    }

    seen.add(value);
    options.push({ value, label: value });
  };

  for (const value of available) {
    pushOption(value);
  }

  for (const value of selected) {
    pushOption(value);
  }

  return options;
};
