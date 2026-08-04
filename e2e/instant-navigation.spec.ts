import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

test.describe("instant navigation", () => {
  test("About link shows the public layout shell immediately", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("fmdLogin")).toBeVisible();

    await instant(
      page,
      async () => {
        await page
          .getByRole("navigation")
          .getByRole("link", { name: "About" })
          .click();
        await expect(page.getByTestId("fmdPublicAuthLayout")).toBeVisible();
        await expect(
          page.getByRole("heading", { name: "About This Project" }),
        ).toBeVisible();
      },
      baseURL ? { baseURL } : undefined,
    );
  });

  test("Legal link shows the public layout shell immediately", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/about");
    await expect(page.getByTestId("fmdPublicAuthLayout")).toBeVisible();

    await instant(
      page,
      async () => {
        await page
          .getByRole("navigation")
          .getByRole("link", { name: "Legal" })
          .click();
        await expect(page.getByTestId("fmdPublicAuthLayout")).toBeVisible();
        await expect(
          page.getByRole("heading", { name: "Terms of Service" }),
        ).toBeVisible();
      },
      baseURL ? { baseURL } : undefined,
    );
  });
});
