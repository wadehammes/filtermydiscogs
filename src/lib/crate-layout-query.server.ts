import { CRATE_LAYOUT_SORT_STEP } from "src/constants/crate";
import { orm } from "src/lib/db";
import {
  mapCrateReleaseLayoutRow,
  mapCrateSetMarkerLayoutRow,
} from "src/lib/db-mappers";
import type {
  CrateReleaseLayoutRow,
  CrateSetMarkerLayoutRow,
} from "src/types/db.types";

type CrateReleaseLayoutWhere = {
  userId: number;
  crateId: string;
};

const isMissingLayoutSchemaError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("unknown column") ||
    message.includes("crate_set_markers") ||
    message.includes("sort_order")
  );
};

export const hasCrateSetMarkerDelegate = (): boolean =>
  "CrateSetMarkers" in orm;

export type { CrateReleaseLayoutRow, CrateSetMarkerLayoutRow };

export async function findCrateReleasesForLayout({
  where,
  skip,
  take,
}: {
  where: CrateReleaseLayoutWhere;
  skip?: number | undefined;
  take?: number | undefined;
}): Promise<CrateReleaseLayoutRow[]> {
  let query = orm.CrateReleases.where(where).orderBy((release) =>
    release.sortOrder.asc(),
  );

  if (skip !== undefined) {
    query = query.offset(skip);
  }
  if (take !== undefined) {
    query = query.limit(take);
  }

  try {
    const rows = await query
      .select("releaseData", "foundAt", "sortOrder")
      .all();

    return rows.map(mapCrateReleaseLayoutRow);
  } catch (error) {
    if (!isMissingLayoutSchemaError(error)) {
      throw error;
    }

    let legacyQuery = orm.CrateReleases.where(where).orderBy((release) =>
      release.addedAt.desc(),
    );
    if (skip !== undefined) {
      legacyQuery = legacyQuery.offset(skip);
    }
    if (take !== undefined) {
      legacyQuery = legacyQuery.limit(take);
    }

    const legacyRows = await legacyQuery.select("releaseData", "foundAt").all();
    return legacyRows.map((row, index) =>
      mapCrateReleaseLayoutRow({
        releaseData: row.releaseData,
        foundAt: row.foundAt,
        sortOrder: (index + 1) * CRATE_LAYOUT_SORT_STEP,
      }),
    );
  }
}

export async function findCrateSetMarkersForLayout({
  where,
}: {
  where: CrateReleaseLayoutWhere;
}): Promise<CrateSetMarkerLayoutRow[]> {
  if (!hasCrateSetMarkerDelegate()) {
    return [];
  }

  try {
    const rows = await orm.CrateSetMarkers.where(where)
      .select("id", "label", "sortOrder")
      .orderBy((marker) => marker.sortOrder.asc())
      .all();

    return rows.map(mapCrateSetMarkerLayoutRow);
  } catch (error) {
    if (isMissingLayoutSchemaError(error)) {
      return [];
    }

    throw error;
  }
}
