import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID } from "src/constants/publicPlaylist.constants";
import { siteCanonicalUrl } from "src/constants/siteMetadata";
import { getPublicCrateIdsForStaticGeneration } from "src/lib/public-crate.server";
import { getPublicPlaylistIdsForStaticGeneration } from "src/lib/public-playlist.server";
import { PUBLIC_SITEMAP_CACHE_TAG } from "src/lib/public-share-cache.server";

const staticRoutes = ["/", "/about", "/legal"] as const;

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");
  cacheTag(PUBLIC_SITEMAP_CACHE_TAG);

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

  const publicPlaylistIds = (
    await getPublicPlaylistIdsForStaticGeneration()
  ).filter((id) => id !== PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID);
  const publicPlaylistEntries = publicPlaylistIds.map((id) => ({
    url: siteCanonicalUrl(`/playlist/${id}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...publicCrateEntries, ...publicPlaylistEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
