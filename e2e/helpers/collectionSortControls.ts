import { expect, type Page } from "@playwright/test";
import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import { e2eReleaseCards } from "./authenticatedExpectations";
import { isDesktopAppNavViewport } from "./viewportLayout";

export type CollectionSortCombobox = "Sort by" | "Then by";

export const ensureCollectionSortControlsVisible = async (page: Page) => {
  if (!isDesktopAppNavViewport(page.viewportSize())) {
    await page.getByRole("button", { name: "Open filters" }).click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  }

  await expect(page.getByRole("combobox", { name: "Sort by" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Then by" })).toBeVisible();
};

export const selectCollectionSortOption = async (
  page: Page,
  combobox: CollectionSortCombobox,
  optionName: string,
) => {
  const trigger = page.getByRole("combobox", { name: combobox });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await expect(page.getByRole("listbox", { name: combobox })).toBeVisible();

  const option = page.getByRole("option", { name: optionName });
  await expect(option).toBeVisible();
  await option.scrollIntoViewIfNeeded();
  await option.click();
  await page.keyboard.press("Escape");
};

export const expectThenByOptionHidden = async (
  page: Page,
  optionName: string,
) => {
  const trigger = page.getByRole("combobox", { name: "Then by" });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await expect(page.getByRole("listbox", { name: "Then by" })).toBeVisible();
  await expect(page.getByRole("option", { name: optionName })).toHaveCount(0);
  await page.keyboard.press("Escape");
};

export const expectReleaseCardsInTitleOrder = async (
  page: Page,
  titles: string[],
) => {
  const cards = e2eReleaseCards(page);
  await expect(cards).toHaveCount(titles.length);

  for (let index = 0; index < titles.length; index += 1) {
    await expect(cards.nth(index)).toContainText(titles[index] ?? "");
  }
};

export const E2E_DEFAULT_DATE_ADDED_NEWEST_ORDER = [
  E2E_ALBUM_ONE,
  E2E_ALBUM_TWO,
  E2E_ALBUM_THREE,
] as const;

export const E2E_TITLE_AZ_ORDER = [
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
] as const;

export const E2E_DATE_ADDED_OLDEST_ORDER = [
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  E2E_ALBUM_ONE,
] as const;
