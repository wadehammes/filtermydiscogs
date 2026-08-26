import type { SortValues } from "src/constants/sortValues";

export type StyleOperator = "AND" | "OR" | "NONE";

export type YearOperator = "OR" | "NONE";

export const VALID_STYLE_OPERATORS = new Set<StyleOperator>([
  "AND",
  "OR",
  "NONE",
]);

export const VALID_YEAR_OPERATORS = new Set<YearOperator>(["OR", "NONE"]);

export const isFilterMatchOperator = (
  value: string | undefined,
): value is StyleOperator =>
  value === "AND" || value === "OR" || value === "NONE";

export const isYearMatchOperator = (
  value: string | undefined,
): value is YearOperator => value === "OR" || value === "NONE";

export type PersistedFiltersJson = {
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  selectedSort: SortValues;
  styleOperator: StyleOperator;
  formatOperator: StyleOperator;
  yearOperator: YearOperator;
  searchQuery: string;
};

export type PersistedFiltersState = PersistedFiltersJson;

export type ReleaseFilterCriteria = Pick<
  PersistedFiltersJson,
  | "selectedStyles"
  | "selectedYears"
  | "selectedFormats"
  | "searchQuery"
  | "styleOperator"
  | "formatOperator"
  | "yearOperator"
>;

export interface FacetOptions {
  availableStyles: string[];
  availableYears: number[];
  availableFormats: string[];
}
