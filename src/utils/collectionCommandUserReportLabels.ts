import type { CollectionCommandUserReportCategory } from "src/lib/validation/collectionCommandUserReport.schemas";
import { COLLECTION_COMMAND_USER_REPORT_CATEGORY_VALUES } from "src/lib/validation/collectionCommandUserReport.schemas";

export const COLLECTION_COMMAND_USER_REPORT_CATEGORY_LABELS: Record<
  CollectionCommandUserReportCategory,
  string
> = {
  interpret_failed: "Interpret failed or gave wrong filters",
  preview_wrong: "Preview count or facts look wrong",
  action_failed: "Apply, save view, or create crate failed",
  other: "Something else",
};

export const COLLECTION_COMMAND_USER_REPORT_CATEGORY_OPTIONS =
  COLLECTION_COMMAND_USER_REPORT_CATEGORY_VALUES.map((value) => ({
    value,
    label: COLLECTION_COMMAND_USER_REPORT_CATEGORY_LABELS[value],
  }));
