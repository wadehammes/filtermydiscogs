import { expect } from "@playwright/test";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { test } from "./fixtures/msw.fixture";
import {
  closeReleaseModal,
  openReleaseModalByTitle,
} from "./helpers/releaseModal";
import { stubE2eCollectionForSimilarModalShuffle } from "./helpers/releaseModalSimilar";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated release modal similar shuffle (MSW)", () => {
  test.beforeEach(async ({ page, network }) => {
    stubE2eCollectionForSimilarModalShuffle(network);
    await gotoReleasesWorkspace(page);
  });

  test("shows the similar pool count and shuffles the visible batch", async ({
    page,
  }) => {
    await openReleaseModalByTitle(page, E2E_ALBUM_ONE);

    const sidebar = page.getByTestId("fmdReleaseSimilarSidebar");
    await expect(sidebar).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("fmdReleaseSimilarSidebarCount")).toHaveText(
      /similar$/,
    );

    const peerButtons = sidebar.getByRole("button", {
      name: /^Open .+ details$/,
    });
    const titlesBeforeShuffle = await peerButtons.allTextContents();

    await page
      .getByRole("button", { name: "Shuffle similar releases" })
      .click();

    await expect
      .poll(async () => peerButtons.allTextContents())
      .not.toEqual(titlesBeforeShuffle);

    await closeReleaseModal(page);
  });
});
