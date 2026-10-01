import { expect, type Page } from "@playwright/test";

export const selectGenreStyleFilter = async (page: Page, style: string) => {
  await page.getByRole("combobox", { name: "Genre & Style" }).click();
  const option = page.getByRole("option", { name: style, exact: true });
  await expect(option).toBeVisible();
  await expect(option).toBeInViewport();
  await option.click();
  await page.keyboard.press("Escape");
};
