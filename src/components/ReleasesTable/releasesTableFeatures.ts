import {
  columnResizingFeature,
  columnSizingFeature,
  tableFeatures,
} from "@tanstack/react-table";

export const releasesTableFeatures = tableFeatures({
  columnSizingFeature,
  columnResizingFeature,
});
