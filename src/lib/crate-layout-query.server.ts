import type { Prisma } from "@prisma/client";
import { CRATE_LAYOUT_SORT_STEP } from "src/constants/crate";
import { prisma } from "src/lib/db";

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
  "crateSetMarker" in prisma &&
  prisma.crateSetMarker != null &&
  typeof prisma.crateSetMarker.findMany === "function";

const crateReleaseLayoutSelect = {
  release_data: true,
  found_at: true,
  sort_order: true,
} satisfies Prisma.CrateReleaseSelect;

const crateReleaseLegacySelect = {
  release_data: true,
  found_at: true,
} satisfies Prisma.CrateReleaseSelect;

export type CrateReleaseLayoutRow = Prisma.CrateReleaseGetPayload<{
  select: typeof crateReleaseLayoutSelect;
}>;

export async function findCrateReleasesForLayout({
  where,
  skip,
  take,
}: {
  where: Prisma.CrateReleaseWhereInput;
  skip?: number | undefined;
  take?: number | undefined;
}): Promise<CrateReleaseLayoutRow[]> {
  const pagination = {
    ...(skip !== undefined ? { skip } : {}),
    ...(take !== undefined ? { take } : {}),
  };

  try {
    return await prisma.crateRelease.findMany({
      where,
      ...pagination,
      select: crateReleaseLayoutSelect,
      orderBy: {
        sort_order: "asc",
      },
    });
  } catch (error) {
    if (!isMissingLayoutSchemaError(error)) {
      throw error;
    }

    const legacyRows = await prisma.crateRelease.findMany({
      where,
      ...pagination,
      select: crateReleaseLegacySelect,
      orderBy: {
        added_at: "desc",
      },
    });

    return legacyRows.map((row, index) => ({
      ...row,
      sort_order: (index + 1) * CRATE_LAYOUT_SORT_STEP,
    }));
  }
}

const crateMarkerSelect = {
  id: true,
  label: true,
  sort_order: true,
} satisfies Prisma.CrateSetMarkerSelect;

export type CrateSetMarkerLayoutRow = Prisma.CrateSetMarkerGetPayload<{
  select: typeof crateMarkerSelect;
}>;

export async function findCrateSetMarkersForLayout({
  where,
}: {
  where: Prisma.CrateSetMarkerWhereInput;
}): Promise<CrateSetMarkerLayoutRow[]> {
  if (!hasCrateSetMarkerDelegate()) {
    return [];
  }

  try {
    return await prisma.crateSetMarker.findMany({
      where,
      select: crateMarkerSelect,
      orderBy: {
        sort_order: "asc",
      },
    });
  } catch (error) {
    if (isMissingLayoutSchemaError(error)) {
      return [];
    }

    throw error;
  }
}
