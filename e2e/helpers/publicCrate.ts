import { expect, type Page } from "@playwright/test";
import { PUBLIC_SHARED_CRATE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import {
  LOGIN_DEMO_PUBLIC_CRATE_PATH,
  LOGIN_DEMO_PUBLIC_CRATE_TITLE,
} from "src/constants/publicCrate.constants";
import { locateVisibleByTestId } from "./locateVisibleByTestId";

export const PUBLIC_DEMO_CRATE_TITLE = LOGIN_DEMO_PUBLIC_CRATE_TITLE;

export const gotoPublicDemoCrate = async (page: Page) => {
  await page.goto(LOGIN_DEMO_PUBLIC_CRATE_PATH, {
    waitUntil: "load",
  });

  await expect(page).toHaveURL(new RegExp(LOGIN_DEMO_PUBLIC_CRATE_PATH));
  await expect(
    page.getByRole("heading", { level: 1, name: PUBLIC_DEMO_CRATE_TITLE }),
  ).toBeVisible({
    timeout: 15_000,
  });

  const publicCrateMain = locateVisibleByTestId(page, "fmdPublicCrate");
  await expect(publicCrateMain).toBeVisible({
    timeout: 15_000,
  });
  await expect(publicCrateMain).toHaveAttribute(
    "aria-label",
    PUBLIC_SHARED_CRATE_MAIN_LABEL,
  );
};
