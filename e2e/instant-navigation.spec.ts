import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";
import {
  clickPublicNavLinkAndWaitForUrl,
  instantNavContentTimeout,
  instantNavOptions,
} from "./helpers/instantNavOptions";

test.describe("instant navigation", () => {
  test.describe.configure({ mode: "serial" });

  test("About link shows the public layout shell immediately", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("fmdLogin")).toBeVisible();

    await instant(
      page,
      async () => {
        await clickPublicNavLinkAndWaitForUrl(page, "About", /\/about/);
        await expect(page.getByTestId("fmdAbout")).toBeVisible({
          timeout: instantNavContentTimeout,
        });
      },
      instantNavOptions(baseURL),
    );
    await expect(
      page.getByRole("heading", {
        name: "Your Discogs collection, unlocked",
      }),
    ).toBeVisible();
  });

  test("Legal link shows the public layout shell immediately", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/about");
    await expect(page.getByTestId("fmdAbout")).toBeVisible();

    await instant(
      page,
      async () => {
        await clickPublicNavLinkAndWaitForUrl(page, "Legal", /\/legal/);
        await expect(
          page.getByRole("heading", { name: "Terms of Service" }),
        ).toBeVisible({ timeout: instantNavContentTimeout });
      },
      instantNavOptions(baseURL),
    );
  });
});
