import { expect, type Locator, type Page } from "@playwright/test";
import { e2eReleaseCards } from "./authenticatedExpectations";
import { releaseModal } from "./releaseModal";

const expectCrateMenuPortaledOutsideHost = async (host: Locator) => {
  await expect(host.getByTestId("fmdReleaseCrateMenu")).toHaveCount(0);
  await expect(host.page().getByTestId("fmdReleaseCrateMenu")).toBeVisible();
};

export const releaseCardByAlbum = (page: Page, albumTitle: string) =>
  e2eReleaseCards(page).filter({ hasText: albumTitle });

export const releaseTableRowByAlbum = (page: Page, albumTitle: string) =>
  page
    .getByRole("table", { name: "Collection releases" })
    .locator("tbody tr")
    .filter({ hasText: albumTitle })
    .first();

export const openReleaseCrateMenuOnCard = async (card: Locator) => {
  const trigger = card.getByTestId("fmdReleaseCrateMenuTrigger");
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const menu = card.page().getByTestId("fmdReleaseCrateMenu");
  await expect(menu).toBeVisible();
  return menu;
};

export const expectCrateMenuPortaledOutsideCard = async (card: Locator) =>
  expectCrateMenuPortaledOutsideHost(card);

export const expectCrateMenuInlineOnCard = async (card: Locator) => {
  const menu = card
    .getByTestId("fmdReleaseCrateMenuHost")
    .getByTestId("fmdReleaseCrateMenu");
  await expect(menu).toBeVisible();
};

export const openReleaseCrateMenuOnTableRow = async (row: Locator) => {
  const trigger = row.getByTestId("fmdReleaseCrateMenuTrigger");
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const menu = row.page().getByTestId("fmdReleaseCrateMenu");
  await expect(menu).toBeVisible();
  return menu;
};

export const expectCrateMenuPortaledOutsideTableRow = async (row: Locator) =>
  expectCrateMenuPortaledOutsideHost(row);

export const scrollReleasesCollection = async (
  page: Page,
  scrollTop: number,
) => {
  const root = page.locator("[data-releases-scroll-root]");
  await root.evaluate((element, top) => {
    element.scrollTop = top;
  }, scrollTop);
};

export const openReleaseCrateMenuInModal = async (page: Page) => {
  const modal = releaseModal(page);
  await expect(modal).toBeVisible();
  const trigger = modal.getByTestId("fmdReleaseCrateMenuTrigger");
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const menu = page.getByTestId("fmdReleaseCrateMenu");
  await expect(menu).toBeVisible();
  return { modal, menu };
};

export const expectCrateMenuPortaledOutsideReleaseModal = async (
  modal: Locator,
) => expectCrateMenuPortaledOutsideHost(modal);
