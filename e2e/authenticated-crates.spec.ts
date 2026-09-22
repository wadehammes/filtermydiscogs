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
    await expect(page.getByTestId("fmdCratesClient")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: "Crates" }),
    ).toBeVisible();
    await expect(page.getByText("1 crate")).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(E2E_DEFAULT_CRATE_NAME, "i") }),
    ).toHaveAttribute("href", `/crates/${E2E_DEFAULT_CRATE_ID}`);
    await expect(
      page.getByText(`${E2E_COLLECTION_RELEASE_COUNT} releases`),
    ).toBeVisible();
    await expect(page.getByText("Default")).toBeVisible();
  });

  test("renders crate detail workspace with E2E releases", async ({ page }) => {
    await page.goto(`/crates/${E2E_DEFAULT_CRATE_ID}`);

    await expect(page).toHaveURL(new RegExp(`/crates/${E2E_DEFAULT_CRATE_ID}`));
    await expectNotOnLogin(page);
    await expect(page.getByTestId("fmdCrateDetailClient")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("fmdCrateReleasesTable")).toBeVisible();
    await expect(page.getByTestId("fmdCrateDetailHeaderActions")).toBeVisible();
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
  });
});
