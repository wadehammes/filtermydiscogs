import type { NetworkFixture } from "@msw/playwright";
import { expect, type Page } from "@playwright/test";
import { buildE2eSimilarModalShuffleCollectionReleases } from "src/tests/msw/e2eCollectionData";
import { createE2eCollectionPageHandler } from "src/tests/msw/e2eCollectionHandlers";
import { createE2eReleaseByIdHandler } from "src/tests/msw/e2eReleaseHandlers";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { expectNotOnLogin } from "./authenticatedExpectations";

export const stubE2eCollectionForSimilarModalShuffle = (
  network: NetworkFixture,
) => {
  const releases = buildE2eSimilarModalShuffleCollectionReleases();

  return network.use(
    createE2eCollectionPageHandler(releases),
    createE2eReleaseByIdHandler({ withSimilarModalPeers: true }),
  );
};

export const gotoReleasesWorkspaceForSimilarModal = async (page: Page) => {
  const releases = buildE2eSimilarModalShuffleCollectionReleases();

  await page.goto("/collection", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/collection/, { timeout: 60_000 });
  await expectNotOnLogin(page);
  await expect(
    page.getByRole("status", { name: `Showing ${releases.length} releases` }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("button", {
      name: `Open release details for ${E2E_ALBUM_ONE}`,
    }),
  ).toBeVisible({ timeout: 30_000 });
};
