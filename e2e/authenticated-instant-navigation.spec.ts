import { instant } from "@next/playwright";
import { expect, test } from "./fixtures/msw.fixture";

test.describe("authenticated instant navigation (MSW)", () => {
  test("Dashboard link shows the app shell immediately from releases", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/releases");
    await expect(page).toHaveURL(/\/releases/);
    await expect(page.getByText("Showing 3 releases")).toBeVisible({
      timeout: 30_000,
    });

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
            name: "testuser's collection",
          }),
        ).toBeVisible();
      },
      baseURL ? { baseURL } : undefined,
    );
  });

  test("Releases link shows the collection grid immediately from dashboard", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("fmdDashboardHeroCount")).toHaveAttribute(
      "aria-label",
      "3",
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
        await expect(page.getByText("Showing 3 releases")).toBeVisible();
        await expect(page.getByTestId("fmdReleaseCard")).toHaveCount(3);
      },
      baseURL ? { baseURL } : undefined,
    );
  });
});
