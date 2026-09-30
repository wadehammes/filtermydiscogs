import { expect, type Locator, type Page } from "@playwright/test";
import {
  E2E_COLLECTION_RELEASE_COUNT,
  e2eCollectionSummaryLabel,
} from "src/tests/msw/e2eSession.constants";

export async function expectNotOnLogin(page: Page) {
  await expect(page.getByTestId("fmdLogin")).toHaveCount(0);
}

export const e2eReleaseCards = (page: Page): Locator =>
  page.locator(
    '[data-testid="fmdReleaseCard"], [data-testid="fmdMobileReleaseCard"]',
  );

export async function expectE2eCollectionLoaded(page: Page) {
  await expect(page.getByText(e2eCollectionSummaryLabel())).toBeVisible({
    timeout: 30_000,
  });
  await expect(e2eReleaseCards(page)).toHaveCount(E2E_COLLECTION_RELEASE_COUNT);
}
