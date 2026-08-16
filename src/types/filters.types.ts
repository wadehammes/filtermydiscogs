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

export type ReleaseFilterCriteria = Pick<
  PersistedFiltersJson,
  | "selectedStyles"
  | "selectedYears"
  | "selectedFormats"
  | "searchQuery"
  | "styleOperator"
>;

export interface FacetOptions {
  availableStyles: string[];
  availableYears: number[];
  availableFormats: string[];
}
