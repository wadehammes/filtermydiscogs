import type { ColumnSizingState } from "@tanstack/react-table";

export type ReleasesTableColumnId =
  | "crate"
  | "artistTitle"
  | "label"
  | "catno"
  | "year"
  | "dateAdded"
  | "formatStyles"
  | "actions";

export const RELEASES_TABLE_DEFAULT_COLUMN_SIZES: Record<
  ReleasesTableColumnId,
  number
> = {
  crate: 40,
  artistTitle: 260,
  label: 120,
  catno: 88,
  year: 60,
  dateAdded: 96,
  formatStyles: 260,
  actions: 120,
};

export const RELEASES_TABLE_COLUMN_IDS: ReleasesTableColumnId[] = [
  "crate",
  "artistTitle",
  "label",
  "catno",
  "year",
  "dateAdded",
  "formatStyles",
  "actions",
];

export const getReleasesTableColumnWidth = (
  columnId: ReleasesTableColumnId,
  columnSizing: ColumnSizingState = {},
): number => {
  const override = columnSizing[columnId];

  return typeof override === "number"
    ? override
    : RELEASES_TABLE_DEFAULT_COLUMN_SIZES[columnId];
};

export const getReleasesTableTotalWidth = (
  columnSizing: ColumnSizingState = {},
): number =>
  RELEASES_TABLE_COLUMN_IDS.reduce(
    (sum, columnId) =>
      sum + getReleasesTableColumnWidth(columnId, columnSizing),
    0,
  );
