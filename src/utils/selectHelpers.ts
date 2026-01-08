/**
 * Checks if an option value is selected in a select component
 * @param value - The current value(s) of the select (string for single, string[] for multiple, or undefined)
 * @param optionValue - The option value to check
 * @returns true if the option is selected, false otherwise
 */
export const isOptionSelected = (
  value: string | string[] | undefined,
  optionValue: string,
): boolean => {
  if (value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.includes(optionValue);
  }
  return value === optionValue;
};
