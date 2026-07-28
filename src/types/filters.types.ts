import type { SortValues } from "src/constants/sortValues";

export type StyleOperator = "AND" | "OR" | "NONE";

export const VALID_STYLE_OPERATORS = new Set<StyleOperator>([
  "AND",
  "OR",
  "NONE",
]);

export type PersistedFiltersJson = {
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  selectedSort: SortValues;
  styleOperator: StyleOperator;
  searchQuery: string;
};

export type PersistedFiltersState = PersistedFiltersJson;
