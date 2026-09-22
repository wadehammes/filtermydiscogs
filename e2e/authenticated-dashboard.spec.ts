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
    await expect(page.getByTestId("fmdDashboardClient")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: e2eDashboardCollectionHeading(),
      }),
    ).toBeVisible();
    await expect(page.getByTestId("fmdDashboardHeroCount")).toHaveAttribute(
      "aria-label",
      e2eDashboardHeroCountLabel(),
    );
    await expect(page.getByText("Estimated value")).toBeVisible();
    await expect(page.getByText("Exact Duplicates")).toBeVisible();
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
    await expect(page.getByText(E2E_TRACK_ONE)).toBeVisible();
    await expect(page.getByText(E2E_TRACK_TWO)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "In your crates" }),
    ).toBeVisible();
    const mostCratedRow = page.getByTestId("fmdDashboardReleaseItem").first();
    await expect(mostCratedRow).toBeVisible();
    await expect(mostCratedRow).toContainText(E2E_ALBUM_ONE);
    await expect(mostCratedRow).toContainText(
      String(E2E_MOST_CRATED_CRATE_COUNT),
    );
    await expect(mostCratedRow).toContainText("crates");
  });
});
