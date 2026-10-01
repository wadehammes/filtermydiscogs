import { expect, type Page } from "@playwright/test";
import {
  E2E_ALBUM_ONE,
  e2eMosaicCollectionSummaryLabel,
} from "src/tests/msw/e2eSession.constants";
import { expectNotOnLogin } from "./authenticatedExpectations";

export const gotoMosaicWorkspace = async (page: Page) => {
  await page.goto("/mosaic");
  await expect(page).toHaveURL(/\/mosaic/);
  await expectNotOnLogin(page);
  await expect(
    page.getByRole("status", { name: e2eMosaicCollectionSummaryLabel() }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", {
      name: `Open release details for ${E2E_ALBUM_ONE}`,
    }),
  ).toBeVisible({
    timeout: 30_000,
  });
};
