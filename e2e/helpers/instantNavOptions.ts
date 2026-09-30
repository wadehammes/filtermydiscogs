import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { isPublicDesktopNavViewport } from "./viewportLayout";

export const instantNavContentTimeout = 15_000;

export function instantNavOptions(baseURL: string | undefined) {
  return baseURL ? { baseURL } : undefined;
}

export async function clickPublicNavLinkAndWaitForUrl(
  page: Page,
  linkName: string,
  urlPattern: RegExp,
) {
  if (isPublicDesktopNavViewport(page.viewportSize())) {
    const link = page
      .getByRole("navigation", { name: "Public" })
      .getByRole("link", { name: linkName });
    await expect(link).toBeVisible();
    await Promise.all([
      page.waitForURL(urlPattern, { timeout: instantNavContentTimeout }),
      link.click(),
    ]);
    return;
  }

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  const link = menu.getByRole("link", { name: linkName });
  await expect(link).toBeVisible();
  await Promise.all([
    page.waitForURL(urlPattern, { timeout: instantNavContentTimeout }),
    link.click(),
  ]);
}
