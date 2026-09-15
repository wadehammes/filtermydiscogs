import { and } from "@prisma/orm-postgres/orm-client";
import { orm } from "src/lib/db";

export type PublicCrateRow = {
  userId: number;
  id: string;
  name: string;
  username: string | null;
  isDefault: boolean;
  private: boolean;
  createdAt: string;
  updatedAt: string;
};

export const findPublicCrateById = async (
  crateId: string,
): Promise<PublicCrateRow | null> => {
  const crates = await orm.Crates.where((crate) =>
    and(crate.id.eq(crateId), crate.private.eq(false)),
  )
    .select(
      "userId",
      "id",
      "name",
      "username",
      "isDefault",
      "private",
      "createdAt",
      "updatedAt",
    )
    .orderBy((crate) => crate.updatedAt.desc())
    .limit(2)
    .all();

  if (crates.length > 1) {
    console.warn(
      JSON.stringify({
        event: "public_crate_ambiguous_id",
        crateId,
        matchCount: crates.length,
      }),
    );
  }

  return crates[0] ?? null;
};

export const findPublicCrateSummaryById = async (
  crateId: string,
): Promise<{ name: string; username: string | null } | null> => {
  const crate = await findPublicCrateById(crateId);

  if (!crate) {
    return null;
  }

  return {
    name: crate.name,
    username: crate.username,
  };
};
