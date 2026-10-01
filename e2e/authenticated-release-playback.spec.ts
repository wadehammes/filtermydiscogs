import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import {
  closeReleaseModal,
  expectReleaseModalShowsE2eTracklist,
  openReleaseModalByTitle,
} from "./helpers/releaseModal";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated release playback queue (MSW)", () => {
  test("add all to queue from the release modal enqueues tracks", async ({
    page,
  }) => {
    await gotoReleasesWorkspace(page);
    await openReleaseModalByTitle(page, E2E_ALBUM_ONE);

    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);
    await page
      .getByRole("button", { name: "Add all playable tracks to queue" })
      .click();
    await closeReleaseModal(page);

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
