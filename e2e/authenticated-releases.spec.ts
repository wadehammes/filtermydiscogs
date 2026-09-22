import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import {
  expectE2eCollectionLoaded,
  expectNotOnLogin,
} from "./helpers/authenticatedExpectations";

test.describe("authenticated releases (MSW)", () => {
  test("renders releases workspace after collection loads", async ({
    page,
  }) => {
    await page.goto("/releases");

    await expect(page).toHaveURL(/\/releases/);
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("navigation", { name: "App" }).getByRole("link", {
        name: "Releases",
      }),
    ).toBeVisible();
    await expectE2eCollectionLoaded(page);
    await expect(
      page.getByRole("group", { name: "Collection view mode" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("fmdReleaseCard").filter({ hasText: E2E_ALBUM_ONE }),
    ).toBeVisible();
    await expect(
      page.getByTestId("fmdReleaseCard").filter({ hasText: E2E_ALBUM_TWO }),
    ).toBeVisible();
    await expect(
      page.getByTestId("fmdReleaseCard").filter({ hasText: E2E_ALBUM_THREE }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Select crate" }),
    ).toBeVisible();
  });
});
