import { cacheLife, cacheTag } from "next/cache";
import { createPublicShareOgImageResponse } from "src/lib/og/createPublicShareOgImageResponse.server";
import { getPublicCrateForOg } from "src/lib/public-crate.server";
import { publicCrateCacheTag } from "src/lib/public-share-cache.server";

async function getCachedCrateForOg(id: string) {
  "use cache";
  cacheLife({ revalidate: 300 });
  cacheTag(publicCrateCacheTag(id));

  return getPublicCrateForOg(id);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const crate = await getCachedCrateForOg(id);
  return createPublicShareOgImageResponse({
    coverThumbUrls: crate?.coverThumbUrls ?? [],
    itemCount: crate?.releaseCount ?? null,
    itemNoun: "release",
    kind: "crate",
    title: crate?.name ?? "Crate",
    updatedAt: crate?.updatedAt ?? null,
    username: crate?.username ?? null,
  });
}
