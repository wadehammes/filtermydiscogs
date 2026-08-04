import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { siteCanonicalUrl } from "src/constants/siteMetadata";

const staticRoutes = ["/", "/about", "/legal"] as const;

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");

  return staticRoutes.map((path) => ({
    url: siteCanonicalUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
