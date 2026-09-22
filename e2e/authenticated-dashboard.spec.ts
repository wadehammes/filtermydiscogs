import { expect, test } from "./fixtures/msw.fixture";

test.describe("authenticated dashboard (MSW)", () => {
  test("renders dashboard sections after collection loads", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("fmdLogin")).toHaveCount(0);
    await expect(page.getByTestId("fmdDashboardClient")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: "testuser's collection" }),
    ).toBeVisible();
    await expect(page.getByTestId("fmdDashboardHeroCount")).toHaveAttribute(
      "aria-label",
      "3",
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
    await expect(page.getByText("E2E Track One")).toBeVisible();
    await expect(page.getByText("E2E Track Two")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "In your crates" }),
    ).toBeVisible();
    const mostCratedRow = page.getByTestId("fmdDashboardReleaseItem").first();
    await expect(mostCratedRow).toBeVisible();
    await expect(mostCratedRow).toContainText("E2E Album One");
    await expect(mostCratedRow).toContainText("2");
    await expect(mostCratedRow).toContainText("crates");
  });
});
