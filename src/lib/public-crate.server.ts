import { cacheLife } from "next/cache";
import { prisma } from "src/lib/db";

export const PUBLIC_CRATE_STATIC_PARAMS_LIMIT = 100;
export const PUBLIC_CRATE_BUILD_PRERENDER_LIMIT = 25;

async function listRecentPublicCrateIds(limit: number): Promise<string[]> {
  "use cache";
  cacheLife({ revalidate: 300 });

  const crates = await prisma.crate.findMany({
    where: { private: false },
    select: { id: true },
    orderBy: { updated_at: "desc" },
    take: limit,
  });

  return crates.map((crate) => crate.id);
}

export async function getPublicCrateIdsForStaticGeneration(
  limit = PUBLIC_CRATE_STATIC_PARAMS_LIMIT,
): Promise<string[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    return await listRecentPublicCrateIds(limit);
  } catch (error) {
    console.error("Failed to list public crates for static generation:", error);
    return [];
  }
}

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
  "use cache";
  cacheLife({ revalidate: 300 });

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
