import { E2E_COLLECTION_RELEASE_COUNT } from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { e2eReleaseCards } from "./helpers/authenticatedExpectations";
import {
  exitRandomView,
  expectDefaultE2eCollectionSummary,
  expectRandomViewShowsSingleRelease,
  switchToRandomView,
} from "./helpers/releasesCollection";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated random collection view (MSW)", () => {
  test("desktop random view shows one release then exits back to the grid", async ({
    page,
  }) => {
    test.skip(
      !isDesktopAppNavViewport(page.viewportSize()),
      "random view toggle is available on desktop collection chrome",
    );

    await gotoReleasesWorkspace(page);
    await expectDefaultE2eCollectionSummary(page);
    await switchToRandomView(page);
    await expectRandomViewShowsSingleRelease(page);

    await exitRandomView(page);
    await expect(e2eReleaseCards(page)).toHaveCount(
      E2E_COLLECTION_RELEASE_COUNT,
    );
    await expectDefaultE2eCollectionSummary(page);
  });
});
