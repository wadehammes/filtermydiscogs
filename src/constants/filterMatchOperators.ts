import type { StyleOperator, YearOperator } from "src/types/filters.types";

export const FILTER_MATCH_OPERATOR_OPTIONS: ReadonlyArray<{
  value: StyleOperator;
  label: string;
}> = [
  { value: "OR", label: "ANY" },
  { value: "AND", label: "ALL" },
  { value: "NONE", label: "NONE" },
];

export const FILTER_YEAR_MATCH_OPERATOR_OPTIONS: ReadonlyArray<{
  value: YearOperator;
  label: string;
}> = [
  { value: "OR", label: "ANY" },
  { value: "NONE", label: "NONE" },
];
