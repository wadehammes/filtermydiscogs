import { DASHBOARD_PAGE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import {
  E2E_ALBUM_ONE,
  E2E_MOST_CRATED_CRATE_COUNT,
  E2E_TRACK_ONE,
  E2E_TRACK_TWO,
  e2eDashboardCollectionHeading,
  e2eDashboardHeroCountLabel,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";

test.describe("authenticated dashboard (MSW)", () => {
  test("renders dashboard sections after collection loads", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard/);
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("main", { name: DASHBOARD_PAGE_MAIN_LABEL }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: e2eDashboardCollectionHeading(),
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("status", { name: e2eDashboardHeroCountLabel() }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Estimated value" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Exact Duplicates" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "This week" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "On repeat" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "Most played" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "Most listened" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: E2E_TRACK_ONE }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: E2E_TRACK_TWO }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "In your crates" }),
    ).toBeVisible();
    const inYourCrates = page.getByRole("region", { name: "In your crates" });
    await expect(
      inYourCrates.getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_ONE}`,
      }),
    ).toBeVisible();
    await expect(
      inYourCrates.getByRole("status", {
        name: `${E2E_MOST_CRATED_CRATE_COUNT} crates`,
      }),
    ).toBeVisible();
  });
});
