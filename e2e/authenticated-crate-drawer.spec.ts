import { E2E_COLLECTION_RELEASE_COUNT } from "src/tests/msw/e2eSession.constants";
import {
  E2E_TAG_DESKTOP_ONLY,
  E2E_TAG_MOBILE_ONLY,
} from "./e2eProjectTags.constants";
import { test } from "./fixtures/msw.fixture";
import {
  expectCrateDrawerShowsReleases,
  openMobileCrateDrawerFromFab,
} from "./helpers/crateDrawer";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated crate drawer (MSW)", () => {
  test("desktop sidebar lists staged releases when the drawer is open", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await gotoReleasesWorkspace(page);
    await expectCrateDrawerShowsReleases(page, E2E_COLLECTION_RELEASE_COUNT);
  });

  test("mobile FAB opens the bottom drawer with staged releases", {
    tag: E2E_TAG_MOBILE_ONLY,
  }, async ({ page }) => {
    await gotoReleasesWorkspace(page);
    await openMobileCrateDrawerFromFab(page);
    await expectCrateDrawerShowsReleases(page, E2E_COLLECTION_RELEASE_COUNT);
  });
});
