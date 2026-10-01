import { expect, type Page } from "@playwright/test";
import {
  expectE2eCollectionLoaded,
  expectNotOnLogin,
} from "./authenticatedExpectations";

export const gotoReleasesWorkspace = async (page: Page) => {
  await page.goto("/releases");
  await expect(page).toHaveURL(/\/releases/);
  await expectNotOnLogin(page);
  await expectE2eCollectionLoaded(page);
};
