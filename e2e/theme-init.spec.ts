import { expect, test } from "@playwright/test";

test.describe("theme init", () => {
  test("uses codex when the OS prefers dark on the landing page", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    await expect(page.getByTestId("fmdLogin")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "codex");
  });

  test("uses light when the OS prefers light on the landing page", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    await expect(page.getByTestId("fmdLogin")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
