import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { siteCanonicalUrl } from "src/constants/siteMetadata";
import { getPublicCrateIdsForStaticGeneration } from "src/lib/public-crate.server";

const staticRoutes = ["/", "/about", "/legal"] as const;

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");

  const staticEntries = staticRoutes.map((path) => ({
    url: siteCanonicalUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "/" ? 1 : 0.7,
  }));

  const publicCrateIds = await getPublicCrateIdsForStaticGeneration();
  const publicCrateEntries = publicCrateIds.map((id) => ({
    url: siteCanonicalUrl(`/crate/${id}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...publicCrateEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
