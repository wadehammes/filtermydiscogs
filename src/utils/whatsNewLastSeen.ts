import { buildWhatsNewLastSeenStorageKey } from "src/constants/storageKeys";
import { WHATS_NEW_LATEST_VERSION } from "src/constants/whatsNew.constants";

export const getWhatsNewLastSeenVersion = (userId: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(buildWhatsNewLastSeenStorageKey(userId));
};

export const persistWhatsNewLastSeenForUser = (
  userId: string,
  version: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(buildWhatsNewLastSeenStorageKey(userId), version);
};

export const clearWhatsNewLastSeenForUser = (userId: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(buildWhatsNewLastSeenStorageKey(userId));
};

export const hasUnseenWhatsNewForUser = (userId: string): boolean =>
  getWhatsNewLastSeenVersion(userId) !== WHATS_NEW_LATEST_VERSION;
