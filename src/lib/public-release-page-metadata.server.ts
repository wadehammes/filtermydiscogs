import "server-only";

import type { Metadata } from "next";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  PUBLIC_SHARE_PAGE_ROBOTS,
  SITE_NAME,
  siteCanonicalUrl,
  sitePageTitle,
} from "src/constants/siteMetadata";
import { loadPublicReleaseDiscogsDetailForPage } from "src/lib/public-release-discogs-detail.server";
import { definedProps } from "src/utils/definedProps";
import { resolvePublicReleaseCatalogNumbers } from "src/utils/publicReleaseTracks";
import { formatDiscogsCreditNames } from "src/utils/releaseDisplay";

export type PublicReleasePageMetadataResolved = {
  title: string;
  description: string;
};

const buildReleaseDescription = (detail: {
  title: string;
  artists?: Array<{ name: string; join?: string }>;
  year?: number;
  labels?: Array<{ name?: string; catno?: string }>;
}): string => {
  const artist = formatDiscogsCreditNames(detail.artists);
  const yearPart =
    typeof detail.year === "number" && detail.year > 0
      ? ` (${detail.year})`
      : "";
  const catnos = resolvePublicReleaseCatalogNumbers(detail);
  const catPart = catnos.length > 0 ? ` · ${catnos.join(", ")}` : "";

  if (artist) {
    return `${detail.title} by ${artist}${yearPart}${catPart} — listen on ${SITE_NAME}`;
  }

  return `${detail.title}${yearPart}${catPart} — listen on ${SITE_NAME}`;
};

export const buildPublicReleasePageMetadata = ({
  id,
  resolved,
}: {
  id: string;
  resolved: PublicReleasePageMetadataResolved;
}): Metadata => {
  const path = `/release/${id}`;
  const canonical = siteCanonicalUrl(path);
  const pageTitle = sitePageTitle(`Release: ${resolved.title}`);

  return {
    title: pageTitle,
    description: resolved.description,
    alternates: { canonical },
    robots: PUBLIC_SHARE_PAGE_ROBOTS,
    openGraph: {
      title: pageTitle,
      description: resolved.description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en-US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: resolved.description,
    },
  };
};

export const getPublicReleaseMetadataForPage = async (
  releaseId: string,
): Promise<PublicReleasePageMetadataResolved | null> => {
  const detail = await loadPublicReleaseDiscogsDetailForPage(releaseId);

  if (detail === null) {
    return null;
  }

  const title = detail.title.trim();

  return {
    title,
    description: buildReleaseDescription({
      title,
      ...definedProps({
        artists: detail.artists,
        year: detail.year,
        labels: detail.labels,
      }),
    }),
  };
};

export const getPrivateReleaseNotFoundMetadata = (): Metadata => {
  const pageTitle = sitePageTitle("Release not found");
  const description = PAGE_DESCRIPTIONS.releaseListenFallback;

  return {
    title: pageTitle,
    description,
    robots: PRIVATE_PAGE_ROBOTS,
    openGraph: {
      title: pageTitle,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: "en-US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
  };
};
