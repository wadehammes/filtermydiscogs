import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const instantNavContentTimeout = 15_000;

export function instantNavOptions(baseURL: string | undefined) {
  return baseURL ? { baseURL } : undefined;
}

export async function clickPublicNavLinkAndWaitForUrl(
  page: Page,
  linkName: string,
  urlPattern: RegExp,
) {
  const link = page
    .getByRole("navigation", { name: "Public" })
    .getByRole("link", { name: linkName });
  await expect(link).toBeVisible();
  await Promise.all([
    page.waitForURL(urlPattern, { timeout: instantNavContentTimeout }),
    link.click(),
  ]);
}
