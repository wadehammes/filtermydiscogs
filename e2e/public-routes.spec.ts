import { expect, test } from "@playwright/test";

test.describe("public routes", () => {
  test("home responds without a server error", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.ok()).toBe(true);
    await expect(page.getByTestId("fmdLogin")).toBeVisible();
  });

  test("about page renders the bento layout", async ({ page }) => {
    await page.goto("/about");

    await expect(page.getByTestId("fmdAbout")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your Discogs collection, unlocked" }),
    ).toBeVisible();
  });
});
