import { LOGIN_FEATURES } from "src/components/Login/loginFeatures.constants";

export const LOGIN_PAGE_SITE_COPY = {
  tagline: "Discover and play your collection",
  lead: "Discogs catalogs your physical media. FilterMyDisco.gs is a free companion app to search and filter it, queue tracks for in-app playback, build playlists and crates, and more.",
  description:
    "Discogs catalogs your physical media. FilterMyDisco.gs is a free companion app to search and filter it, queue tracks for in-app playback, build playlists and crates, and more.",
  previewAltSuffix:
    "app preview with advanced collection filters, release cards, in-app playback, playlists, crates, collection insights, and on-repeat stats",
} as const;

export const LOGIN_PAGE_UI_COPY = {
  bottomCtaHeading: "Connect your collection",
  featuresSectionHeading: "Features",
  featuresSectionLede:
    "Filter releases, play through the queue, and share crates or playlists.",
  publicShareTeaserLead: "Listen to a ",
  publicShareTeaserPlaylistLinkLabel: "shared playlist",
  publicShareTeaserJoiner: " or browse a ",
  publicShareTeaserCrateLinkLabel: "shared crate",
  publicShareTeaserSuffix: " (no sign-in required).",
  termsPrivacyLink: "Terms & Privacy",
  finePrintFreePrefix: "Free to use (",
  finePrintSupportLink: "support helps",
  finePrintFreeSuffix: ")",
} as const;

export type LoginPageCopyEntry = {
  id: string;
  text: string;
  source: string;
};

export const buildLoginPreviewAlt = (siteName: string): string =>
  `${siteName} ${LOGIN_PAGE_SITE_COPY.previewAltSuffix}`;

export const getLoginPageCopyEntries = (
  siteName: string,
): LoginPageCopyEntry[] => {
  const entries: LoginPageCopyEntry[] = [
    {
      id: "site.tagline",
      text: LOGIN_PAGE_SITE_COPY.tagline,
      source: "loginPageCopy.registry",
    },
    {
      id: "site.lead",
      text: LOGIN_PAGE_SITE_COPY.lead,
      source: "loginPageCopy.registry",
    },
    {
      id: "site.description",
      text: LOGIN_PAGE_SITE_COPY.description,
      source: "loginPageCopy.registry",
    },
    {
      id: "site.previewAlt",
      text: buildLoginPreviewAlt(siteName),
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.bottomCtaHeading",
      text: LOGIN_PAGE_UI_COPY.bottomCtaHeading,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.featuresSectionHeading",
      text: LOGIN_PAGE_UI_COPY.featuresSectionHeading,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.featuresSectionLede",
      text: LOGIN_PAGE_UI_COPY.featuresSectionLede,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.publicShareTeaserLead",
      text: LOGIN_PAGE_UI_COPY.publicShareTeaserLead,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.publicShareTeaserPlaylistLinkLabel",
      text: LOGIN_PAGE_UI_COPY.publicShareTeaserPlaylistLinkLabel,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.publicShareTeaserJoiner",
      text: LOGIN_PAGE_UI_COPY.publicShareTeaserJoiner,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.publicShareTeaserCrateLinkLabel",
      text: LOGIN_PAGE_UI_COPY.publicShareTeaserCrateLinkLabel,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.publicShareTeaserSuffix",
      text: LOGIN_PAGE_UI_COPY.publicShareTeaserSuffix,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.termsPrivacyLink",
      text: LOGIN_PAGE_UI_COPY.termsPrivacyLink,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.finePrintFreePrefix",
      text: LOGIN_PAGE_UI_COPY.finePrintFreePrefix,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.finePrintSupportLink",
      text: LOGIN_PAGE_UI_COPY.finePrintSupportLink,
      source: "loginPageCopy.registry",
    },
    {
      id: "ui.finePrintFreeSuffix",
      text: LOGIN_PAGE_UI_COPY.finePrintFreeSuffix,
      source: "loginPageCopy.registry",
    },
  ];

  LOGIN_FEATURES.forEach((feature, index) => {
    entries.push(
      {
        id: `features.${index}.eyebrow`,
        text: feature.eyebrow,
        source: "loginFeatures.constants",
      },
      {
        id: `features.${index}.title`,
        text: feature.title,
        source: "loginFeatures.constants",
      },
      {
        id: `features.${index}.description`,
        text: feature.description,
        source: "loginFeatures.constants",
      },
    );

    if (feature.imageAlt) {
      entries.push({
        id: `features.${index}.imageAlt`,
        text: feature.imageAlt,
        source: "loginFeatures.constants",
      });
    }
  });

  return entries;
};

export const LOGIN_PAGE_COPY_SOURCE_FILES = [
  "src/constants/loginPageCopy.registry.ts",
  "src/components/Login/loginFeatures.constants.ts",
  "src/components/Login/Login.component.tsx",
  "src/components/LoginBottomCta/LoginBottomCta.component.tsx",
  "src/tests/utils/loginPageCopyLiteraryRules.ts",
  "src/tests/utils/loginPageCopyLiteraryRules.spec.ts",
] as const;
