import { cacheLife, cacheTag } from "next/cache";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "src/constants/siteMetadata";
import { PublicShareOgImage } from "src/lib/og/publicShareOgImage";
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
  const title = crate?.name ?? "Crate";
  const line2 = crate?.username
    ? `by ${crate.username} · ${SITE_NAME}`
    : SITE_NAME;

  return new ImageResponse(
    <PublicShareOgImage
      title={title}
      line2={line2}
      coverThumbUrls={crate?.coverThumbUrls ?? []}
    />,
    {
      height: 630,
      width: 1200,
    },
  );
}
