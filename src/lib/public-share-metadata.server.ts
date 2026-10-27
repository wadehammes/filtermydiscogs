import type { Metadata } from "next";
import {
  getMetadataSiteUrl,
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  PUBLIC_SHARE_PAGE_ROBOTS,
  SITE_NAME,
  siteCanonicalUrl,
  sitePageTitle,
} from "src/constants/siteMetadata";
import { resolvePlaylistPublicShareMetaDescription } from "src/utils/publicPlaylistDescription";

export type PublicShareMetadataKind = "crate" | "playlist";

type PublicShareMetadataResolved = {
  name: string;
  username: string | null;
  itemCount: number;
  publicDescription?: string | null;
};

type BuildPublicSharePageMetadataInput = {
  kind: PublicShareMetadataKind;
  id: string;
  resolved: PublicShareMetadataResolved | null;
};

const SHARE_COPY: Record<
  PublicShareMetadataKind,
  {
    fallbackPageTitle: string;
    fallbackDescription: string;
    entityLabel: string;
    itemNoun: string;
    ogAltPrefix: string;
  }
> = {
  crate: {
    fallbackPageTitle: "Crate",
    fallbackDescription: PAGE_DESCRIPTIONS.crateFallback,
    entityLabel: "crate",
    itemNoun: "release",
    ogAltPrefix: "Public crate",
  },
  playlist: {
    fallbackPageTitle: "Playlist",
    fallbackDescription: PAGE_DESCRIPTIONS.playlistFallback,
    entityLabel: "playlist",
    itemNoun: "track",
    ogAltPrefix: "Public playlist",
  },
};

const buildShareDescription = ({
  kind,
  name,
  username,
  itemCount,
}: PublicShareMetadataResolved & { kind: PublicShareMetadataKind }): string => {
  const { entityLabel, itemNoun } = SHARE_COPY[kind];
  const countLabel = `${itemCount} ${itemNoun}${itemCount !== 1 ? "s" : ""}`;

  if (username) {
    return `Public ${entityLabel} "${name}" by ${username} with ${countLabel} on ${SITE_NAME}`;
  }

  return `Public ${entityLabel} "${name}" with ${countLabel} on ${SITE_NAME}`;
};

export const buildPublicSharePageMetadata = ({
  kind,
  id,
  resolved,
}: BuildPublicSharePageMetadataInput): Metadata => {
  const copy = SHARE_COPY[kind];
  const path = kind === "crate" ? `/crate/${id}` : `/playlist/${id}`;
  const canonical = siteCanonicalUrl(path);
  const baseUrl = getMetadataSiteUrl();
  const ogImageUrl = new URL(`/api/og/${kind}/${id}`, baseUrl).href;

  if (!resolved) {
    const fallbackTitle = sitePageTitle(copy.fallbackPageTitle);

    return {
      title: fallbackTitle,
      description: copy.fallbackDescription,
      robots: PRIVATE_PAGE_ROBOTS,
      openGraph: {
        title: fallbackTitle,
        description: copy.fallbackDescription,
        url: canonical,
        siteName: SITE_NAME,
        type: "website",
        locale: "en-US",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: copy.ogAltPrefix,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: copy.fallbackDescription,
        images: [
          {
            url: ogImageUrl,
            alt: copy.ogAltPrefix,
          },
        ],
      },
    };
  }

  const { name, username } = resolved;
  const byline = username ? ` by ${username}` : "";
  const title = `${name}${byline} | ${SITE_NAME}`;
  const ogTitle = `${name}${byline}`;
  const description =
    kind === "playlist"
      ? resolvePlaylistPublicShareMetaDescription(
          resolved.publicDescription,
          () => buildShareDescription({ kind, ...resolved }),
        )
      : buildShareDescription({ kind, ...resolved });

  return {
    title,
    description,
    robots: PUBLIC_SHARE_PAGE_ROBOTS,
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      locale: "en-US",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${copy.ogAltPrefix}: ${name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          alt: `${copy.ogAltPrefix}: ${name}`,
        },
      ],
    },
  };
};
