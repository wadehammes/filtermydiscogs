import { expect, type Locator, type Page } from "@playwright/test";
import { e2eReleaseCards } from "./authenticatedExpectations";

export const releaseCardByAlbum = (page: Page, albumTitle: string) =>
  e2eReleaseCards(page).filter({ hasText: albumTitle });

export const openReleaseCrateMenuOnCard = async (card: Locator) => {
  const trigger = card.getByTestId("fmdReleaseCrateMenuTrigger");
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const menu = card.page().getByTestId("fmdReleaseCrateMenu");
  await expect(menu).toBeVisible();
  return menu;
};

export const expectCrateMenuPortaledOutsideCard = async (card: Locator) => {
  await expect(card.getByTestId("fmdReleaseCrateMenu")).toHaveCount(0);
  await expect(card.page().getByTestId("fmdReleaseCrateMenu")).toBeVisible();
};

export const expectCrateMenuInlineOnCard = async (card: Locator) => {
  const menu = card
    .getByTestId("fmdReleaseCrateMenuHost")
    .getByTestId("fmdReleaseCrateMenu");
  await expect(menu).toBeVisible();
};

export const scrollReleasesCollection = async (
  page: Page,
  scrollTop: number,
) => {
  const root = page.locator("[data-releases-scroll-root]");
  await root.evaluate((element, top) => {
    element.scrollTop = top;
  }, scrollTop);
};
