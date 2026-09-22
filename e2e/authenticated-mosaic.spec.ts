import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  e2eMosaicCollectionSummaryLabel,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";

test.describe("authenticated mosaic (MSW)", () => {
  test("renders mosaic grid after collection loads", async ({ page }) => {
    await page.goto("/mosaic");

    await expect(page).toHaveURL(/\/mosaic/);
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "Album Mosaic" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(e2eMosaicCollectionSummaryLabel()),
    ).toBeVisible();
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
});
