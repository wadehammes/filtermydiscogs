import { E2E_COLLECTION_RELEASE_COUNT } from "src/tests/msw/e2eSession.constants";
import { test } from "./fixtures/msw.fixture";
import {
  expectCrateDrawerShowsReleases,
  openMobileCrateDrawerFromFab,
} from "./helpers/crateDrawer";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated crate drawer (MSW)", () => {
  test("desktop sidebar lists staged releases when the drawer is open", async ({
    page,
  }) => {
    test.skip(
      !isDesktopAppNavViewport(page.viewportSize()),
      "desktop crate sidebar (open by default)",
    );

    await gotoReleasesWorkspace(page);
    await expectCrateDrawerShowsReleases(page, E2E_COLLECTION_RELEASE_COUNT);
  });

  test("mobile FAB opens the bottom drawer with staged releases", async ({
    page,
  }) => {
    test.skip(isDesktopAppNavViewport(page.viewportSize()), "mobile crate FAB");

    await gotoReleasesWorkspace(page);
    await openMobileCrateDrawerFromFab(page);
    await expectCrateDrawerShowsReleases(page, E2E_COLLECTION_RELEASE_COUNT);
  });
});
