import { expect, type Page } from "@playwright/test";
import { PUBLIC_SHARED_CRATE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { LOGIN_DEMO_PUBLIC_CRATE_PATH } from "src/constants/publicCrate.constants";

export const PUBLIC_DEMO_CRATE_TITLE = "E2E Public Demo Crate";

export const gotoPublicDemoCrate = async (page: Page) => {
  await page.goto(LOGIN_DEMO_PUBLIC_CRATE_PATH, {
    waitUntil: "domcontentloaded",
  });

  await expect(page).toHaveURL(new RegExp(LOGIN_DEMO_PUBLIC_CRATE_PATH));
  const publicCrateMain = page.getByTestId("fmdPublicCrate");
  await expect(publicCrateMain).toBeVisible({
    timeout: 15_000,
  });
  await expect(publicCrateMain).toHaveAttribute(
    "aria-label",
    PUBLIC_SHARED_CRATE_MAIN_LABEL,
  );
  await expect(
    page.getByRole("heading", { level: 1, name: PUBLIC_DEMO_CRATE_TITLE }),
  ).toBeVisible({
    timeout: 15_000,
  });
};
