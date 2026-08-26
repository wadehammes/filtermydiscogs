import type { Crate } from "src/types/crate.types";

export type { JsonValue } from "src/lib/db";

export type CrateRow = Crate;

export type CrateReleaseLayoutRow = {
  release_data: unknown;
  found_at: Date | null;
  sort_order: number;
  section_id: string | null;
};

export type CrateSetMarkerLayoutRow = {
  id: string;
  label: string;
  sort_order: number;
  parent_id: string | null;
  accent_key: string | null;
};
