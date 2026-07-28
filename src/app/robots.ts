import type { MetadataRoute } from "next";
import { getMetadataSiteUrl } from "src/constants/siteMetadata";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getMetadataSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
