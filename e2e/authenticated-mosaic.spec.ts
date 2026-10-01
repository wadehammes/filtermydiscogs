import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { gotoMosaicWorkspace } from "./helpers/mosaicWorkspace";

test.describe("authenticated mosaic (MSW)", () => {
  test("renders mosaic grid after collection loads", async ({ page }) => {
    await gotoMosaicWorkspace(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "Album Mosaic" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Download Mosaic" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_ONE}`,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_TWO}`,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_THREE}`,
      }),
    ).toBeVisible();
  });

  test("download mosaic starts generation for the mocked collection", async ({
    page,
  }) => {
    await gotoMosaicWorkspace(page);
    await expect(
      page.getByRole("button", { name: "Download Mosaic" }),
    ).toBeVisible({ timeout: 30_000 });

    const downloadButton = page.getByRole("button", {
      name: "Download Mosaic",
    });
    const downloadEvent = page.waitForEvent("download", { timeout: 60_000 });
    await downloadButton.click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toMatch(/\.(png|jpe?g)$/i);
  });
});
