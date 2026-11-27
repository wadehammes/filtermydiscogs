import { HttpResponse, http } from "msw";
import { DASHBOARD_PAGE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { createAuthenticatedE2eHandlers } from "src/tests/msw/createAuthenticatedE2eHandlers";
import { buildE2eCollectionReleasesWithExactDuplicate } from "src/tests/msw/e2eCollectionData";
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

  test("shows value outage copy when collection value fails", async ({
    page,
    network,
  }) => {
    await network.use(
      http.get("/api/collection/value", () =>
        HttpResponse.json({ message: "upstream" }, { status: 503 }),
      ),
    );

    await page.goto("/dashboard");
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("group", { name: "Estimated value" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Estimated value unavailable")).toBeVisible();
  });
});

test.describe("authenticated dashboard duplicate shelf (MSW)", () => {
  test.use({
    handlers: createAuthenticatedE2eHandlers({
      releases: buildE2eCollectionReleasesWithExactDuplicate(),
    }),
  });

  test("opens exact duplicates modal", async ({ page }) => {
    await page.goto("/dashboard");
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("group", { name: "Exact Duplicates" }),
    ).toBeVisible({ timeout: 30_000 });
    await page
      .getByRole("group", { name: "Exact Duplicates" })
      .getByRole("button", { name: "Show details" })
      .click();
    await expect(page.getByTestId("fmdDuplicatesDetailModal")).toBeVisible();
  });
});
