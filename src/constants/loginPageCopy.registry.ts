import { LOGIN_FEATURES } from "src/components/Login/loginFeatures.constants";

export const LOGIN_PAGE_SITE_COPY = {
  tagline: "Digging made easier.",
  lead: "Browse and filter your collection, organize crates with set notes and gig packing, explore insights, and share cover-art mosaics.",
  description:
    "Browse and filter your Discogs collection, organize crates with set notes and gig packing, explore insights, and share cover-art mosaics.",
  previewAltSuffix:
    "app preview showing release cards, filters, crate organization, and collection insights",
} as const;

export const LOGIN_PAGE_UI_COPY = {
  bottomCtaHeading: "Ready to explore your collection?",
  termsPrivacyLink: "Terms & Privacy",
  finePrintFreePrefix: "Free to use (",
  finePrintSupportLink: "support is greatly appreciated",
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
