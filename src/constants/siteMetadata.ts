import {
  buildLoginPreviewAlt,
  LOGIN_PAGE_SITE_COPY,
} from "./loginPageCopy.registry";

export const SITE_NAME = "FilterMyDiscogs";
export const DEFAULT_SITE_URL = "https://www.filtermydisco.gs";
export const SITE_GITHUB_URL = "https://github.com/wadehammes/filtermydiscogs";
export const SITE_INSTAGRAM_URL = "https://www.instagram.com/filtermydiscogs";

export const SITE_TAGLINE = LOGIN_PAGE_SITE_COPY.tagline;
export const SITE_DESCRIPTION = LOGIN_PAGE_SITE_COPY.description;
export const SITE_LEAD = LOGIN_PAGE_SITE_COPY.lead;

export const COLLECTION_FORMATS_PHRASE =
  "vinyl, CDs, and tapes, plus any other format Discogs supports";

export const SITE_DEFAULT_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`;

export const LOGIN_PREVIEW_ALT = buildLoginPreviewAlt(SITE_NAME);

export const sitePageTitle = (page: string): string => `${page} | ${SITE_NAME}`;

export const getMetadataSiteUrl = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const siteCanonicalUrl = (path = "/"): string => {
  const base = getMetadataSiteUrl().replace(/\/$/, "");
  if (path === "/" || path === "") {
    return base;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export const PRIVATE_PAGE_ROBOTS = {
  index: false,
  follow: false,
} as const;

export const PAGE_DESCRIPTIONS = {
  releases:
    "Search, filter, and sort your Discogs collection. Open releases for tracklists and in-app playback, and add albums to crates as you browse.",
  dashboard:
    "Explore collection insights: milestones, style evolution, growth trends, and more.",
  mosaic:
    "Create cover-art mosaic grids from your collection or crates for social sharing.",
  crates:
    "Review crate releases in a table, edit collection notes, and pack albums for your gig.",
  cratesDetail:
    "Open a crate to review releases, edit collection notes, and pack for your gig.",
  settings:
    "Manage theme, sync preferences, and stored data for your FilterMyDiscogs account.",
  about: `FilterMyDiscogs helps you browse, filter, and organize your Discogs collection, including ${COLLECTION_FORMATS_PHRASE}. Contact, support, and open-source details.`,
  legal: "Terms of Service and Privacy Policy for FilterMyDiscogs.",
  admin: "Admin statistics and analytics dashboard.",
  crateFallback: "A shared crate on FilterMyDiscogs.",
} as const;

export const homeStructuredData = () => {
  const siteUrl = getMetadataSiteUrl();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
        applicationCategory: "MusicApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        sameAs: [SITE_GITHUB_URL, SITE_INSTAGRAM_URL],
      },
    ],
  };
};
