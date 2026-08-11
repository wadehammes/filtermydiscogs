interface ApplyFilterValueChangeParams {
  multiple: boolean;
  onChange: (value: string | string[]) => void;
  newValue: string | string[] | null;
}

export const getFilterControlledValue = (
  value: string | string[] | undefined,
  multiple: boolean,
): string | string[] | null => {
  if (multiple) {
    return Array.isArray(value) ? value : [];
  }

  return typeof value === "string" ? value : null;
};

export const applyFilterValueChange = ({
  multiple,
  onChange,
  newValue,
}: ApplyFilterValueChangeParams) => {
  if (multiple) {
    onChange(Array.isArray(newValue) ? newValue : []);
    return;
  }

  if (typeof newValue === "string") {
    onChange(newValue);
  }
};
