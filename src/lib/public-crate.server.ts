import { prisma } from "src/lib/db";

export async function getPublicCrateForOg(crateId: string): Promise<{
  name: string;
  username: string | null;
} | null> {
  const crate = await prisma.crate.findFirst({
    select: {
      name: true,
      username: true,
    },
    where: {
      id: crateId,
      private: false,
    },
  });
  return crate;
}

export async function getPublicCrateMetadataForPage(crateId: string): Promise<{
  crate: { name: string; username: string | null };
  pagination: { total: number };
} | null> {
  const crate = await prisma.crate.findFirst({
    select: {
      id: true,
      name: true,
      user_id: true,
      username: true,
    },
    where: {
      id: crateId,
      private: false,
    },
  });
  if (!crate) {
    return null;
  }
  const total = await prisma.crateRelease.count({
    where: {
      crate_id: crate.id,
      user_id: crate.user_id,
    },
  });
  return {
    crate: { name: crate.name, username: crate.username },
    pagination: { total },
  };
}
