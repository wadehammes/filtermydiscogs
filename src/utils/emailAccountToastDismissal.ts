import { buildEmailAccountToastDismissedStorageKey } from "src/constants/storageKeys";

export const hasEmailAccountToastBeenDismissed = (userId: string): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    localStorage.getItem(buildEmailAccountToastDismissedStorageKey(userId)) ===
    "1"
  );
};

export const markEmailAccountToastDismissed = (userId: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(buildEmailAccountToastDismissedStorageKey(userId), "1");
};
