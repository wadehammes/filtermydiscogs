import { expect, test } from "./fixtures/msw.fixture";

test.describe("authenticated mosaic (MSW)", () => {
  test("renders mosaic grid after collection loads", async ({ page }) => {
    await page.goto("/mosaic");

    await expect(page).toHaveURL(/\/mosaic/);
    await expect(page.getByTestId("fmdLogin")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Album Mosaic" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText("Showing all 3 releases from your collection"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download Mosaic" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Open release details for E2E Album One",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Open release details for E2E Album Two",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Open release details for E2E Album Three",
      }),
    ).toBeVisible();
  });
});
