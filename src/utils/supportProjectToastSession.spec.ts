import {
  hasSupportProjectToastBeenShownThisSession,
  markSupportProjectToastShownThisSession,
  SUPPORT_PROJECT_TOAST_SESSION_KEY,
} from "src/utils/supportProjectToastSession";

describe("supportProjectToastSession", () => {
  it("when session is fresh, reports the support toast has not been shown", () => {
    sessionStorage.removeItem(SUPPORT_PROJECT_TOAST_SESSION_KEY);

    expect(hasSupportProjectToastBeenShownThisSession()).toBe(false);
  });

  it("when marked shown, reports the support toast was shown this session", () => {
    sessionStorage.removeItem(SUPPORT_PROJECT_TOAST_SESSION_KEY);

    markSupportProjectToastShownThisSession();

    expect(hasSupportProjectToastBeenShownThisSession()).toBe(true);
  });
});
