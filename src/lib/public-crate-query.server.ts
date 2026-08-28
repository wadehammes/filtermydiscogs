import { prisma } from "src/lib/db";

const PUBLIC_CRATE_SELECT = {
  user_id: true,
  id: true,
  name: true,
  username: true,
  is_default: true,
  private: true,
  created_at: true,
  updated_at: true,
} as const;

export type PublicCrateRow = {
  user_id: number;
  id: string;
  name: string;
  username: string | null;
  is_default: boolean;
  private: boolean;
  created_at: Date;
  updated_at: Date;
};

export const findPublicCrateById = async (
  crateId: string,
): Promise<PublicCrateRow | null> => {
  const crates = await prisma.crate.findMany({
    where: {
      id: crateId,
      private: false,
    },
    select: PUBLIC_CRATE_SELECT,
    take: 2,
    orderBy: { updated_at: "desc" },
  });

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
