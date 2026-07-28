import type { MetadataRoute } from "next";
import { siteCanonicalUrl } from "src/constants/siteMetadata";

const staticRoutes = ["/", "/about", "/legal"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((path) => ({
    url: siteCanonicalUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
