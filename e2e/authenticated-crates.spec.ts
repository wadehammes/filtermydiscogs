import {
  CRATE_ACTIONS_TOOLBAR_LABEL,
  CRATE_DETAIL_MAIN_LABEL,
  CRATE_RELEASES_LIST_LABEL,
} from "src/constants/accessibilityLabels.constants";
import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  E2E_COLLECTION_RELEASE_COUNT,
  E2E_DEFAULT_CRATE_ID,
  E2E_DEFAULT_CRATE_NAME,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";

test.describe("authenticated crates (MSW)", () => {
  test("renders crates hub with the default crate card", async ({ page }) => {
    await page.goto("/crates");

    await expect(page).toHaveURL(/\/crates$/);
    await expectNotOnLogin(page);
    await expect(page.getByRole("main", { name: "Crates" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("status", { name: "1 crate" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(E2E_DEFAULT_CRATE_NAME, "i") }),
    ).toHaveAttribute("href", `/crates/${E2E_DEFAULT_CRATE_ID}`);
    await expect(
      page.getByRole("status", {
        name: `${E2E_COLLECTION_RELEASE_COUNT} releases`,
      }),
    ).toBeVisible();
    await expect(page.getByRole("status", { name: "Default" })).toBeVisible();
  });

  test("renders crate detail workspace with E2E releases", async ({ page }) => {
    await page.goto(`/crates/${E2E_DEFAULT_CRATE_ID}`);

    await expect(page).toHaveURL(new RegExp(`/crates/${E2E_DEFAULT_CRATE_ID}`));
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("main", { name: CRATE_DETAIL_MAIN_LABEL }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("list", { name: CRATE_RELEASES_LIST_LABEL }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: CRATE_ACTIONS_TOOLBAR_LABEL }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Select crate" }),
    ).toContainText(E2E_DEFAULT_CRATE_NAME);
    await expect(
      page.getByRole("button", { name: `Open ${E2E_ALBUM_ONE}` }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: `Open ${E2E_ALBUM_TWO}` }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: `Open ${E2E_ALBUM_THREE}` }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Reorder" })).toHaveCount(3);
    await expect(
      page.getByRole("button", {
        name: "Add section (splits the list here)",
      }),
    ).not.toHaveCount(0);
  });
});
