import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import {
  expectCrateMenuPortaledOutsideReleaseModal,
  openReleaseCrateMenuInModal,
  releaseCardByAlbum,
} from "./helpers/releaseCrateMenu";
import {
  closeReleaseModal,
  closeReleaseModalWithOpenCrateMenu,
  expectReleaseModalShowsE2eTracklist,
  openReleaseModalFromCard,
} from "./helpers/releaseModal";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated release modal (MSW)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoReleasesWorkspace(page);
  });

  test("opens from a release card and loads the tracklist", async ({
    page,
  }) => {
    const card = releaseCardByAlbum(page, E2E_ALBUM_ONE);
    await openReleaseModalFromCard(page, card, E2E_ALBUM_ONE);
    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);
    await closeReleaseModal(page);
  });

  test("portals the crate menu outside the clipped modal toolbar", async ({
    page,
  }) => {
    const card = releaseCardByAlbum(page, E2E_ALBUM_ONE);
    await openReleaseModalFromCard(page, card, E2E_ALBUM_ONE);
    const { modal } = await openReleaseCrateMenuInModal(page);
    await expectCrateMenuPortaledOutsideReleaseModal(modal);
    await expect(
      page
        .getByTestId("fmdReleaseCrateMenu")
        .filter({ hasText: "Add to new crate" }),
    ).toBeVisible();
    await closeReleaseModalWithOpenCrateMenu(page, modal);
  });
});
