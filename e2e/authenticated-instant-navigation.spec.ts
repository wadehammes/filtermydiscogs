import { instant } from "@next/playwright";
import {
  e2eDashboardCollectionHeading,
  e2eDashboardHeroCountLabel,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectE2eCollectionLoaded } from "./helpers/authenticatedExpectations";
import { instantNavOptions } from "./helpers/instantNavOptions";

test.describe("authenticated instant navigation (MSW)", () => {
  test("Dashboard link shows the app shell immediately from releases", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/releases");
    await expect(page).toHaveURL(/\/releases/);
    await expectE2eCollectionLoaded(page);

    await instant(
      page,
      async () => {
        await page
          .getByRole("navigation", { name: "App" })
          .getByRole("link", { name: "Dashboard" })
          .click();
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByTestId("fmdDashboardHero")).toBeVisible();
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: e2eDashboardCollectionHeading(),
          }),
        ).toBeVisible();
      },
      instantNavOptions(baseURL),
    );
  });

  test("Releases link shows the collection grid immediately from dashboard", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("fmdDashboardHeroCount")).toHaveAttribute(
      "aria-label",
      e2eDashboardHeroCountLabel(),
      { timeout: 30_000 },
    );

    await instant(
      page,
      async () => {
        await page
          .getByRole("navigation", { name: "App" })
          .getByRole("link", { name: "Releases" })
          .click();
        await expect(page).toHaveURL(/\/releases/);
        await expectE2eCollectionLoaded(page);
      },
      instantNavOptions(baseURL),
    );
  });
});
