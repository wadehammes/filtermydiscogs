import { expect } from "@playwright/test";
import { RELEASE_MODAL_INSTANCE_PARAM } from "src/constants";
import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_ONE_INSTANCE_ID,
} from "src/tests/msw/e2eSession.constants";
import { test } from "./fixtures/msw.fixture";
import {
  closeReleaseModal,
  expectReleaseModalShowsE2eTracklist,
  openReleaseModalByTitle,
  openSimilarReleaseFromModal,
} from "./helpers/releaseModal";
import {
  gotoReleasesWorkspaceForSimilarModal,
  stubE2eCollectionForSimilarModalShuffle,
} from "./helpers/releaseModalSimilar";

test.describe("authenticated release modal similar pagination (MSW)", () => {
  test.beforeEach(async ({ page, network }) => {
    stubE2eCollectionForSimilarModalShuffle(network);
    await gotoReleasesWorkspaceForSimilarModal(page);
  });

  test("shows the similar pool count and advances to the next page", async ({
    page,
  }) => {
    await openReleaseModalByTitle(page, E2E_ALBUM_ONE);

    const sidebar = page.getByTestId("fmdReleaseSimilarSidebar");
    await expect(sidebar).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("fmdReleaseSimilarSidebarCount")).toHaveText(
      /similar$/,
    );
    await expect(page.getByTestId("fmdReleaseSimilarSidebarPage")).toHaveText(
      "1 of 2",
    );

    const peerButtons = sidebar.getByRole("button", {
      name: /^Open .+ details$/,
    });
    const titlesBeforeNextPage = await peerButtons.allTextContents();

    await page
      .getByRole("button", { name: "Next similar releases page" })
      .click();

    await expect(page.getByTestId("fmdReleaseSimilarSidebarPage")).toHaveText(
      "2 of 2",
    );

    await expect
      .poll(async () => peerButtons.allTextContents())
      .not.toEqual(titlesBeforeNextPage);

    await closeReleaseModal(page);
  });

  test("restores the similar page when reopening the anchor instance after a similar release", async ({
    page,
  }) => {
    await openReleaseModalByTitle(page, E2E_ALBUM_ONE);

    const sidebar = page.getByTestId("fmdReleaseSimilarSidebar");
    await expect(sidebar).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("fmdReleaseSimilarSidebarPage")).toHaveText(
      "1 of 2",
    );

    await page
      .getByRole("button", { name: "Next similar releases page" })
      .click();

    await expect(page.getByTestId("fmdReleaseSimilarSidebarPage")).toHaveText(
      "2 of 2",
    );

    const pageTwoPeer = sidebar
      .getByRole("button", { name: /^Open .+ details$/ })
      .first();
    await expect(pageTwoPeer).toBeVisible();
    const pageTwoPeerLabel = await pageTwoPeer.getAttribute("aria-label");
    const similarPeerOnPageTwo = pageTwoPeerLabel
      ?.replace(/^Open /, "")
      .replace(/ details$/, "");

    if (!similarPeerOnPageTwo) {
      throw new Error("Similar sidebar page 2 did not expose a peer title");
    }

    await openSimilarReleaseFromModal(page, similarPeerOnPageTwo);

    await page.goto(
      `/collection?${RELEASE_MODAL_INSTANCE_PARAM}=${E2E_ALBUM_ONE_INSTANCE_ID}`,
    );
    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);

    const modal = page.getByTestId("fmdReleaseModal");
    await expect(modal.getByTestId("fmdReleaseSimilarSidebarPage")).toHaveText(
      "2 of 2",
      { timeout: 15_000 },
    );

    await closeReleaseModal(page);
  });
});
