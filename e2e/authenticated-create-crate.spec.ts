import { E2E_ALBUM_TWO } from "src/tests/msw/e2eSession.constants";
import { test } from "./fixtures/msw.fixture";
import {
  E2E_NEW_CRATE_NAME,
  submitCreateCrateDialog,
} from "./helpers/createCrateDialog";
import {
  openReleaseCrateMenuOnCard,
  releaseCardByAlbum,
} from "./helpers/releaseCrateMenu";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated create crate (MSW)", () => {
  test("creates a crate from the release card menu", async ({ page }) => {
    await gotoReleasesWorkspace(page);

    const card = releaseCardByAlbum(page, E2E_ALBUM_TWO);
    await openReleaseCrateMenuOnCard(card);
    await page.getByRole("menuitem", { name: "Add to new crate" }).click();
    await submitCreateCrateDialog(page, E2E_NEW_CRATE_NAME);

    await page.goto("/crates");
    await page
      .getByRole("link", { name: new RegExp(E2E_NEW_CRATE_NAME, "i") })
      .waitFor({
        state: "visible",
        timeout: 15_000,
      });
  });
});
