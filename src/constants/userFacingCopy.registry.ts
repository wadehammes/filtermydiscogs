import { ABOUT_DONATION_BODY } from "src/constants/about.constants";
import {
  COOKIE_CONSENT_DESCRIPTION,
  COOKIE_CONSENT_TITLE,
} from "src/constants/cookieConsentCopy.constants";
import {
  DASHBOARD_PLAYBACK_SECTION_LEDE,
  DUPLICATES_EMPTY_TITLE,
} from "src/constants/dashboardCopy.constants";
import { DONATION_PRODUCT } from "src/constants/donate.constants";
import {
  getLoginPageCopyEntries,
  LOGIN_PAGE_COPY_SOURCE_FILES,
  type LoginPageCopyEntry,
} from "src/constants/loginPageCopy.registry";
import {
  MARKETING_COLLECTION_INSIGHTS_BULLET,
  MARKETING_CRATE_ORGANIZE_BULLET,
  MARKETING_CRATE_ORGANIZE_BULLET_GENERIC,
  MARKETING_FILTER_BULLET,
  MARKETING_MOSAIC_BULLET,
  MARKETING_PLAYLIST_BULLET,
  MARKETING_PLAYLIST_BULLET_PUBLIC_PAGE,
} from "src/constants/marketingPublicCopy";
import { formatPlaylistSkippedNotInCollectionToast } from "src/constants/playlistPlaybackCopy.constants";
import { PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_TOOLTIP } from "src/constants/publicReleaseListen.constants";
import {
  SENTRY_USER_FEEDBACK_DIALOG_DESCRIPTION,
  SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
} from "src/constants/sentryUserFeedbackForm.constants";
import {
  SETTINGS_COMPLETE_LOGOUT_DIALOG_MESSAGE,
  SETTINGS_COMPLETE_LOGOUT_PANEL_DESCRIPTION,
} from "src/constants/settingsCopy.constants";
import {
  buildSupportProjectToastTitle,
  SUPPORT_PROJECT_TOAST_DESCRIPTION,
} from "src/constants/supportProjectToast.constants";

export type UserFacingCopyEntry = LoginPageCopyEntry;

const MARKETING_BULLETS = [
  { id: "marketing.filter", bullet: MARKETING_FILTER_BULLET },
  { id: "marketing.insights", bullet: MARKETING_COLLECTION_INSIGHTS_BULLET },
  { id: "marketing.playlist", bullet: MARKETING_PLAYLIST_BULLET },
  {
    id: "marketing.playlistPublicPage",
    bullet: MARKETING_PLAYLIST_BULLET_PUBLIC_PAGE,
  },
  {
    id: "marketing.crateGeneric",
    bullet: MARKETING_CRATE_ORGANIZE_BULLET_GENERIC,
  },
  { id: "marketing.crateDemo", bullet: MARKETING_CRATE_ORGANIZE_BULLET },
  { id: "marketing.mosaic", bullet: MARKETING_MOSAIC_BULLET },
] as const;

export const getUserFacingCopyEntries = (
  siteName: string,
): UserFacingCopyEntry[] => {
  const entries: UserFacingCopyEntry[] = [
    ...getLoginPageCopyEntries(siteName),
    ...MARKETING_BULLETS.flatMap(({ id, bullet }) => [
      {
        id: `${id}.label`,
        text: bullet.label,
        source: "marketingPublicCopy.ts",
      },
      {
        id: `${id}.text`,
        text: bullet.text,
        source: "marketingPublicCopy.ts",
      },
    ]),
    {
      id: "support.toastTitle",
      text: buildSupportProjectToastTitle(siteName),
      source: "supportProjectToast.constants.ts",
    },
    {
      id: "support.toastDescription",
      text: SUPPORT_PROJECT_TOAST_DESCRIPTION,
      source: "supportProjectToast.constants.ts",
    },
    {
      id: "about.donationBody",
      text: ABOUT_DONATION_BODY,
      source: "about.constants.ts",
    },
    {
      id: "donate.productDescription",
      text: DONATION_PRODUCT.description,
      source: "donate.constants.ts",
    },
    {
      id: "settings.completeLogoutPanel",
      text: SETTINGS_COMPLETE_LOGOUT_PANEL_DESCRIPTION,
      source: "settingsCopy.constants.ts",
    },
    {
      id: "settings.completeLogoutDialog",
      text: SETTINGS_COMPLETE_LOGOUT_DIALOG_MESSAGE,
      source: "settingsCopy.constants.ts",
    },
    {
      id: "dashboard.duplicatesEmpty",
      text: DUPLICATES_EMPTY_TITLE,
      source: "dashboardCopy.constants.ts",
    },
    {
      id: "dashboard.playbackLede",
      text: DASHBOARD_PLAYBACK_SECTION_LEDE,
      source: "dashboardCopy.constants.ts",
    },
    {
      id: "cookieConsent.title",
      text: COOKIE_CONSENT_TITLE,
      source: "cookieConsentCopy.constants.ts",
    },
    {
      id: "cookieConsent.description",
      text: COOKIE_CONSENT_DESCRIPTION,
      source: "cookieConsentCopy.constants.ts",
    },
    {
      id: "sentry.feedbackSuccessToast",
      text: SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
      source: "sentryUserFeedbackForm.constants.ts",
    },
    {
      id: "sentry.feedbackDialogDescription",
      text: SENTRY_USER_FEEDBACK_DIALOG_DESCRIPTION,
      source: "sentryUserFeedbackForm.constants.ts",
    },
    {
      id: "publicRelease.noPlayableTracksTooltip",
      text: PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_TOOLTIP,
      source: "publicReleaseListen.constants.ts",
    },
    {
      id: "playlist.skippedNotInCollectionToast",
      text: formatPlaylistSkippedNotInCollectionToast(2),
      source: "playlistPlaybackCopy.constants.ts",
    },
  ];

  return entries;
};

export const USER_FACING_COPY_SOURCE_FILES = [
  ...LOGIN_PAGE_COPY_SOURCE_FILES,
  "src/constants/userFacingCopy.registry.ts",
  "src/constants/marketingPublicCopy.ts",
  "src/constants/supportProjectToast.constants.ts",
  "src/constants/about.constants.ts",
  "src/constants/donate.constants.ts",
  "src/constants/settingsCopy.constants.ts",
  "src/constants/dashboardCopy.constants.ts",
  "src/constants/cookieConsentCopy.constants.ts",
  "src/constants/sentryUserFeedbackForm.constants.ts",
  "src/constants/publicReleaseListen.constants.ts",
  "src/constants/playlistPlaybackCopy.constants.ts",
  "src/components/SupportProjectToast/supportProjectToast.tsx",
  "src/components/About/AboutDonationSection.component.tsx",
  "src/components/CookieConsentBanner/CookieConsentBanner.component.tsx",
  "src/components/Settings/SettingsClient.component.tsx",
  "src/components/Settings/SettingsSectionPanels.component.tsx",
  "src/components/Dashboard/DuplicatesList.component.tsx",
  "src/utils/dashboardStory.ts",
] as const;
