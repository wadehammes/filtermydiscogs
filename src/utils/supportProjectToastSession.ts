import { SUPPORT_PROJECT_TOAST_SESSION_KEY } from "src/constants/supportProjectToast.constants";

export { SUPPORT_PROJECT_TOAST_SESSION_KEY };

export const hasSupportProjectToastBeenShownThisSession = (): boolean => {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  return sessionStorage.getItem(SUPPORT_PROJECT_TOAST_SESSION_KEY) === "1";
};

export const markSupportProjectToastShownThisSession = (): void => {
  sessionStorage.setItem(SUPPORT_PROJECT_TOAST_SESSION_KEY, "1");
};
