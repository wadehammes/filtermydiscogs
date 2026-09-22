import { expect, type Page } from "@playwright/test";
import {
  E2E_COLLECTION_RELEASE_COUNT,
  e2eCollectionSummaryLabel,
} from "src/tests/msw/e2eSession.constants";

export async function expectNotOnLogin(page: Page) {
  await expect(page.getByTestId("fmdLogin")).toHaveCount(0);
}

export async function expectE2eCollectionLoaded(page: Page) {
  await expect(page.getByText(e2eCollectionSummaryLabel())).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("fmdReleaseCard")).toHaveCount(
    E2E_COLLECTION_RELEASE_COUNT,
  );
}
