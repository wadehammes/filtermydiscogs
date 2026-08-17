import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CookieConsentBannerPageObject } from "src/components/CookieConsentBanner/CookieConsentBanner.po";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import { screen } from "test-utils";

let po: CookieConsentBannerPageObject;

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    po = new CookieConsentBannerPageObject();
    document.documentElement.removeAttribute("data-theme");
  });

  it("shows the banner when consent is pending", () => {
    po.renderCookieConsentBanner();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Accept analytics" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Essential only" }),
    ).toBeInTheDocument();
  });

  it("hides the banner after accepting analytics", async () => {
    const user = userEvent.setup();

    po.renderCookieConsentBanner();

    await user.click(screen.getByRole("button", { name: "Accept analytics" }));

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
  });

  it("hides the banner after choosing essential only", async () => {
    const user = userEvent.setup();

    po.renderCookieConsentBanner();

    await user.click(screen.getByRole("button", { name: "Essential only" }));

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
  });

  it("renders while a palette theme is active on the document root", () => {
    document.documentElement.setAttribute("data-theme", "midnight");

    po.renderCookieConsentBanner();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
