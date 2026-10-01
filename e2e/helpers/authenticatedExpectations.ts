import { expect, type Locator, type Page } from "@playwright/test";
import { SIGN_IN_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import {
  E2E_COLLECTION_RELEASE_COUNT,
  e2eCollectionSummaryLabel,
} from "src/tests/msw/e2eSession.constants";

export async function expectNotOnLogin(page: Page) {
  await expect(
    page.getByRole("region", { name: SIGN_IN_REGION_LABEL }),
  ).toHaveCount(0);
}

export async function expectLoginLanding(page: Page) {
  await expect(
    page.getByRole("region", { name: SIGN_IN_REGION_LABEL }),
  ).toBeVisible();
}

export const e2eReleaseCards = (page: Page): Locator =>
  page.locator(
    '[data-testid="fmdReleaseCard"], [data-testid="fmdMobileReleaseCard"]',
  );

export async function expectE2eCollectionLoaded(page: Page) {
  await expect(
    page.getByRole("status", { name: e2eCollectionSummaryLabel() }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(e2eReleaseCards(page)).toHaveCount(E2E_COLLECTION_RELEASE_COUNT);
}
