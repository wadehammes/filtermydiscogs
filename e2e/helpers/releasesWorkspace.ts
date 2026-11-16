import { expect, type Page } from "@playwright/test";
import {
  expectE2eCollectionLoaded,
  expectNotOnLogin,
} from "./authenticatedExpectations";

export const gotoReleasesWorkspace = async (page: Page) => {
  await page.goto("/collection", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/collection/, { timeout: 60_000 });
  await expectNotOnLogin(page);
  await expectE2eCollectionLoaded(page);
};
