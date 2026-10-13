import { expect, type Page } from "@playwright/test";
import {
  expectE2eCollectionLoaded,
  expectNotOnLogin,
} from "./authenticatedExpectations";

export const gotoReleasesWorkspace = async (page: Page) => {
  await page.goto("/releases", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/releases/, { timeout: 60_000 });
  await expectNotOnLogin(page);
  await expectE2eCollectionLoaded(page);
};
