import { SITE_NAME } from "src/constants/siteMetadata";

export const CLEAR_ALL_DATA_CONFIRM_PHRASE = "DELETE MY ACCOUNT";

export const CLEAR_ALL_DATA_TITLE = "Delete account";

export const CLEAR_ALL_DATA_ACTION_LABEL = "Delete account";

export const CLEAR_ALL_DATA_ACTION_LOADING_LABEL = "Deleting...";

export const CLEAR_ALL_DATA_DIALOG_CONFIRM_LABEL = "Delete account";

export const CLEAR_ALL_DATA_PANEL_LEAD = `Permanently deletes your ${SITE_NAME} account and everything we store for you on our servers and in this browser. Your Discogs account, collection, and marketplace data are not affected.`;

export const CLEAR_ALL_DATA_ABOUT_INTRO = `Remove your ${SITE_NAME} account and everything we store for you. Your Discogs collection and notes stay on Discogs.`;

export const CLEAR_ALL_DATA_LOGIN_REQUIRED_NOTE =
  "You must be logged in to delete your account.";

export const CLEAR_ALL_DATA_DIALOG_MESSAGE = `This permanently deletes your ${SITE_NAME} account and cannot be undone. It logs you out, clears authentication tokens, deletes all stored crates and playlists, in-app playback stats (per-track play and listen counts), saved preferences, saved email contact (including any unconfirmed address and email verification state), marketing opt-in choice, and cached data on this browser, including your analytics cookie choice. You will need to authorize the app again to continue using ${SITE_NAME}. Your Discogs account and collection are not deleted or changed on Discogs.`;

export const CLEAR_ALL_DATA_ERROR_MESSAGE =
  "Failed to delete account. Please try again.";
