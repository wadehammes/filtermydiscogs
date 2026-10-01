import { expect, type Page } from "@playwright/test";
import { e2eCollectionSummaryLabel } from "src/tests/msw/e2eSession.constants";
import { e2eReleaseCards } from "./authenticatedExpectations";
import { isDesktopAppNavViewport } from "./viewportLayout";

export const expectShowingReleaseCount = async (page: Page, count: number) => {
  await expect(
    page.getByRole("status", { name: `Showing ${count} releases` }),
  ).toBeVisible();
};

export const expectDefaultE2eCollectionSummary = async (page: Page) => {
  await expect(
    page.getByRole("status", { name: e2eCollectionSummaryLabel() }),
  ).toBeVisible();
};

export const searchReleasesCollection = async (page: Page, query: string) => {
  if (!isDesktopAppNavViewport(page.viewportSize())) {
    await page.getByRole("button", { name: "Open filters" }).click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  }

  const search = page.getByRole("textbox", { name: /search/i });
  await search.fill(query);
  await search.blur();
};

export const closeMobileFiltersDrawer = async (page: Page) => {
  const closeButton = page.getByRole("button", { name: "Close filters" });
  if (await closeButton.isVisible()) {
    await closeButton.click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toHaveCount(0);
  }
};

export const switchCollectionView = async (
  page: Page,
  view: "card" | "list",
) => {
  const label = view === "card" ? "Switch to card view" : "Switch to list view";
  await page.getByRole("button", { name: label }).click();
};

export const expectCardGridVisible = async (page: Page) => {
  await expect(e2eReleaseCards(page).first()).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Collection releases" }),
  ).toHaveCount(0);
};

export const expectListTableVisible = async (page: Page) => {
  await expect(
    page.getByRole("table", { name: "Collection releases" }),
  ).toBeVisible();
  await expect(e2eReleaseCards(page)).toHaveCount(0);
};

export const switchToRandomView = async (page: Page) => {
  await page.getByRole("button", { name: "Switch to random view" }).click();
};

export const exitRandomView = async (page: Page) => {
  const mobileExit = page.getByRole("button", { name: "Exit random mode" });
  if (await mobileExit.isVisible()) {
    await mobileExit.click();
    return;
  }

  await page.getByRole("button", { name: "Switch to card view" }).click();
};

export const expectRandomViewShowsSingleRelease = async (page: Page) => {
  await expect(e2eReleaseCards(page)).toHaveCount(1);
};
