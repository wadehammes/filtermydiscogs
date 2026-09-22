import { expect, test } from "./fixtures/msw.fixture";

test.describe("authenticated crates (MSW)", () => {
  test("renders crates hub with the default crate card", async ({ page }) => {
    await page.goto("/crates");

    await expect(page).toHaveURL(/\/crates$/);
    await expect(page.getByTestId("fmdLogin")).toHaveCount(0);
    await expect(page.getByTestId("fmdCratesClient")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: "Crates" }),
    ).toBeVisible();
    await expect(page.getByText("1 crate")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Test Crate/i }),
    ).toHaveAttribute("href", "/crates/crate-1");
    await expect(page.getByText("3 releases")).toBeVisible();
    await expect(page.getByText("Default")).toBeVisible();
  });

  test("renders crate detail workspace with E2E releases", async ({ page }) => {
    await page.goto("/crates/crate-1");

    await expect(page).toHaveURL(/\/crates\/crate-1/);
    await expect(page.getByTestId("fmdLogin")).toHaveCount(0);
    await expect(page.getByTestId("fmdCrateDetailClient")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("fmdCrateReleasesTable")).toBeVisible();
    await expect(page.getByTestId("fmdCrateDetailHeaderActions")).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Select crate" }),
    ).toContainText("Test Crate");
    await expect(
      page.getByRole("button", { name: "Open E2E Album One" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open E2E Album Two" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open E2E Album Three" }),
    ).toBeVisible();
  });
});
