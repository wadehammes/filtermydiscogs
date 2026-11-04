import {
  formatSortMenuAccessibleLabel,
  isThenByCompatibleWithPrimary,
  SORTING_OPTIONS,
  SORTING_SECONDARY_OPTIONS,
  type SortMenuGroup,
} from "src/constants/sorting";
import { SortSecondaryValues, type SortValues } from "src/constants/sortValues";
import { definedProps } from "src/utils/definedProps";

export { normalizeThenBySortSelection } from "src/constants/sorting";

const mapSortSelectOption = (
  option: {
    value: string;
    name: string;
    menuField: string;
    menuOrder?: string;
    shortName: string;
    menuGroup?: SortMenuGroup;
  },
  separatorBefore: boolean,
) => ({
  value: option.value,
  label: formatSortMenuAccessibleLabel(option.menuField, option.menuOrder),
  menuField: option.menuField,
  shortLabel: option.shortName,
  separatorBefore,
  ...definedProps({ menuOrder: option.menuOrder }),
});

const mapSortOptionsWithGroupSeparators = <
  T extends {
    value: string;
    name: string;
    menuField: string;
    menuOrder?: string;
    shortName: string;
    menuGroup?: SortMenuGroup;
  },
>(
  options: readonly T[],
  groupKeyForOption: (option: T) => SortMenuGroup | SortSecondaryValues.None,
) => {
  let previousGroup: SortMenuGroup | SortSecondaryValues.None | undefined;

  return options.map((option) => {
    const groupKey = groupKeyForOption(option);
    const separatorBefore =
      previousGroup !== undefined && groupKey !== previousGroup;

    previousGroup = groupKey;

    return mapSortSelectOption(option, separatorBefore);
  });
};

export const getPrimarySortSelectOptions = () =>
  mapSortOptionsWithGroupSeparators(
    SORTING_OPTIONS,
    (option) => option.menuGroup,
  );

export const getThenBySortSelectOptions = (primarySort: SortValues) => {
  const filtered = SORTING_SECONDARY_OPTIONS.filter((option) =>
    isThenByCompatibleWithPrimary(primarySort, option.value),
  );

  return mapSortOptionsWithGroupSeparators(filtered, (option) =>
    option.value === SortSecondaryValues.None
      ? SortSecondaryValues.None
      : option.menuGroup,
  );
};
