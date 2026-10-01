import { expect, type Page } from "@playwright/test";
import { E2E_AUTH_USERNAME } from "src/tests/msw/e2eSession.constants";

export const openUserMenu = async (page: Page) => {
  await page.getByRole("button", { name: E2E_AUTH_USERNAME }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Logout" })).toBeVisible();
};

export const logoutFromUserMenu = async (page: Page) => {
  await openUserMenu(page);
  await page.getByRole("menuitem", { name: "Logout" }).click();
};
