import { DASHBOARD_PAGE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";
import { gotoMosaicWorkspace } from "./helpers/mosaicWorkspace";
import {
  closeReleaseModal,
  expectReleaseModalShowsE2eTracklist,
} from "./helpers/releaseModal";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated release modal from other routes (MSW)", () => {
  test("mosaic tile opens the release modal", async ({ page }) => {
    await gotoMosaicWorkspace(page);
    await page
      .getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_ONE}`,
      })
      .click();
    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);
    await closeReleaseModal(page);
  });

  test("dashboard most-crated row opens the release modal", async ({
    page,
  }) => {
    test.skip(
      !isDesktopAppNavViewport(page.viewportSize()),
      "dashboard row cover trigger is reliable on desktop layout",
    );

    await page.goto("/dashboard");
    await expect(
      page.getByRole("main", { name: DASHBOARD_PAGE_MAIN_LABEL }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expectNotOnLogin(page);
    await page
      .getByRole("region", { name: "In your crates" })
      .getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_ONE}`,
      })
      .click();
    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);
    await closeReleaseModal(page);
  });
});
