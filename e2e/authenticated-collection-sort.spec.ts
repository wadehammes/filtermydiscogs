import {
  E2E_TAG_DESKTOP_ONLY,
  E2E_TAG_MOBILE_ONLY,
} from "./e2eProjectTags.constants";
import { test } from "./fixtures/msw.fixture";
import { expectE2eCollectionLoaded } from "./helpers/authenticatedExpectations";
import {
  E2E_DATE_ADDED_OLDEST_ORDER,
  E2E_DEFAULT_DATE_ADDED_NEWEST_ORDER,
  E2E_TITLE_AZ_ORDER,
  ensureCollectionSortControlsVisible,
  expectReleaseCardsInTitleOrder,
  expectThenByOptionHidden,
  selectCollectionSortOption,
} from "./helpers/collectionSortControls";
import { closeMobileFiltersDrawer } from "./helpers/releasesCollection";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated collection sort (MSW)", () => {
  test("reorders releases from Sort by and Then by on desktop", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await gotoReleasesWorkspace(page);
    await expectE2eCollectionLoaded(page);

    await expectReleaseCardsInTitleOrder(page, [
      ...E2E_DEFAULT_DATE_ADDED_NEWEST_ORDER,
    ]);

    await selectCollectionSortOption(page, "Sort by", "Title A–Z");
    await expectReleaseCardsInTitleOrder(page, [...E2E_TITLE_AZ_ORDER]);

    await selectCollectionSortOption(page, "Sort by", "Artist A–Z");
    await selectCollectionSortOption(page, "Then by", "Date Added oldest");
    await expectReleaseCardsInTitleOrder(page, [
      ...E2E_DATE_ADDED_OLDEST_ORDER,
    ]);
  });

  test("hides the opposite date added direction in Then by on desktop", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await gotoReleasesWorkspace(page);
    await expectE2eCollectionLoaded(page);

    await selectCollectionSortOption(page, "Sort by", "Date Added newest");
    await expectThenByOptionHidden(page, "Date Added oldest");
  });

  test("exposes Sort by and Then by in the mobile filters drawer", {
    tag: E2E_TAG_MOBILE_ONLY,
  }, async ({ page }) => {
    await gotoReleasesWorkspace(page);
    await expectE2eCollectionLoaded(page);

    await ensureCollectionSortControlsVisible(page);
    await closeMobileFiltersDrawer(page);
  });
});
