import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { test } from "./fixtures/msw.fixture";
import { releaseCardByAlbum } from "./helpers/releaseCrateMenu";
import {
  closeReleaseModal,
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
});
