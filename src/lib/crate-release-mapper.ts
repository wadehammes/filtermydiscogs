import type { CrateReleaseItem } from "src/types/crate.types";
import type { DiscogsRelease } from "src/types/discogs-release.types";

export function mapCrateReleaseRow(row: {
  release_data: unknown;
  found_at: Date | null;
  sort_order?: number;
}): CrateReleaseItem {
  const releaseData = row.release_data as DiscogsRelease;

  if (releaseData && typeof releaseData.instance_id !== "string") {
    releaseData.instance_id = String(releaseData.instance_id);
  }

  return {
    release: releaseData,
    found_at: row.found_at?.toISOString() ?? null,
    sort_order: row.sort_order ?? 0,
  };
}

export function mapCrateSetMarkerRow(row: {
  id: string;
  label: string;
  sort_order?: number;
}) {
  return {
    id: row.id,
    label: row.label,
    sort_order: row.sort_order ?? 0,
  };
}
