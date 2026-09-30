import { expect, type Page } from "@playwright/test";
import { isDesktopAppNavViewport } from "./viewportLayout";

export async function expectAppNavLinkReachable(
  page: Page,
  linkName: string,
): Promise<void> {
  if (isDesktopAppNavViewport(page.viewportSize())) {
    await expect(
      page
        .getByRole("navigation", { name: "App" })
        .getByRole("link", { name: linkName }),
    ).toBeVisible();
    return;
  }

  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
}

export async function clickAppNavLink(
  page: Page,
  linkName: string,
): Promise<void> {
  if (isDesktopAppNavViewport(page.viewportSize())) {
    await page
      .getByRole("navigation", { name: "App" })
      .getByRole("link", { name: linkName })
      .click();
    return;
  }

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: linkName }).click();
}
