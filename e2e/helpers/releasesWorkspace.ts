import { expect, type Page } from "@playwright/test";
import {
  expectE2eCollectionLoaded,
  expectNotOnLogin,
} from "./authenticatedExpectations";

const waitForE2eCollectionFetch = (page: Page) =>
  page.waitForResponse(
    (response) => {
      try {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/collection" &&
          response.request().method() === "GET" &&
          response.ok()
        );
      } catch {
        return false;
      }
    },
    { timeout: 30_000 },
  );

export const gotoReleasesWorkspace = async (page: Page) => {
  const collectionLoaded = waitForE2eCollectionFetch(page);
  await page.goto("/releases");
  await collectionLoaded;
  await expect(page).toHaveURL(/\/releases/);
  await expectNotOnLogin(page);
  await expectE2eCollectionLoaded(page);
};
