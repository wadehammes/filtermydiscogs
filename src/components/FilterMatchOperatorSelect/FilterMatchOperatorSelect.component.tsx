import Select from "src/components/Select/Select.component";
import { FILTER_MATCH_OPERATOR_OPTIONS } from "src/constants/filterMatchOperators";
import type { StyleOperator, YearOperator } from "src/types/filters.types";

interface FilterMatchOperatorSelectProps {
  selectedCount: number;
  value: StyleOperator | YearOperator;
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
  options?: ReadonlyArray<{
    value: StyleOperator | YearOperator;
    label: string;
  }>;
}

export const FilterMatchOperatorSelect = ({
  selectedCount,
  value,
  onChange,
  disabled = false,
  showLabel = false,
  options = FILTER_MATCH_OPERATOR_OPTIONS,
}: FilterMatchOperatorSelectProps) => {
  if (selectedCount <= 1) {
    return null;
  }

  return (
    <Select
      showLabel={showLabel}
      label="Match"
      options={[...options]}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select operator..."
    />
  );
};
