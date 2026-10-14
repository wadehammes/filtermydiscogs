import { expect, test } from "@playwright/test";
import { ABOUT_PAGE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { expectLoginLanding } from "./helpers/authenticatedExpectations";

test.describe("public routes", () => {
  test("home responds without a server error", async ({ page }) => {
    const response = await page.goto("/");

    expect(response?.ok()).toBe(true);
    await expectLoginLanding(page);
  });

  test("unknown URLs render the not-found page", async ({ page }) => {
    const response = await page.goto("/no-such-route-for-e2e");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Go home" })).toBeVisible();
  });

  test("about page renders the bento layout", async ({ page }) => {
    await page.goto("/about");

    await expect(
      page.getByRole("main", { name: ABOUT_PAGE_MAIN_LABEL }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your Discogs collection, unlocked" }),
    ).toBeVisible();
  });
});
