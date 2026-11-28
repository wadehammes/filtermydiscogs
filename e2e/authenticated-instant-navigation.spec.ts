import { instant } from "@next/playwright";
import { DASHBOARD_PAGE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import {
  e2eDashboardCollectionHeading,
  e2eDashboardHeroCountLabel,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { clickAppNavLink } from "./helpers/appNavigation";
import { expectE2eCollectionLoaded } from "./helpers/authenticatedExpectations";
import {
  instantNavContentTimeout,
  instantNavOptions,
} from "./helpers/instantNavOptions";

test.describe("authenticated instant navigation (MSW)", () => {
  test("Dashboard link shows the app shell immediately from collection", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/collection");
    await expect(page).toHaveURL(/\/collection/);
    await expectE2eCollectionLoaded(page);

    await instant(
      page,
      async () => {
        await clickAppNavLink(page, "Dashboard");
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(
          page.getByRole("main", { name: DASHBOARD_PAGE_MAIN_LABEL }),
        ).toBeVisible({
          timeout: instantNavContentTimeout,
        });
      },
      instantNavOptions(baseURL),
    );

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: e2eDashboardCollectionHeading(),
      }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("Collection link shows the collection grid immediately from dashboard", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("status", { name: e2eDashboardHeroCountLabel() }),
    ).toBeVisible({ timeout: 30_000 });

    await instant(
      page,
      async () => {
        await clickAppNavLink(page, "Collection");
        await expect(page).toHaveURL(/\/collection/);
        await expectE2eCollectionLoaded(page);
      },
      instantNavOptions(baseURL),
    );
  });
});
