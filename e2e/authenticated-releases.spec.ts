import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  E2E_DEFAULT_CRATE_NAME,
} from "src/tests/msw/e2eSession.constants";
import {
  E2E_TAG_DESKTOP_ONLY,
  E2E_TAG_MOBILE_ONLY,
} from "./e2eProjectTags.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectAppNavLinkReachable } from "./helpers/appNavigation";
import { e2eReleaseCards } from "./helpers/authenticatedExpectations";
import {
  expectCrateMenuInlineOnCard,
  expectCrateMenuPortaledOutsideCard,
  expectCrateMenuPortaledOutsideTableRow,
  openReleaseCrateMenuOnCard,
  openReleaseCrateMenuOnTableRow,
  releaseCardByAlbum,
  releaseTableRowByAlbum,
  scrollReleasesCollection,
} from "./helpers/releaseCrateMenu";
import {
  expectListTableVisible,
  switchCollectionView,
} from "./helpers/releasesCollection";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated releases (MSW)", () => {
  test("renders releases workspace after collection loads", async ({
    page,
  }) => {
    await gotoReleasesWorkspace(page);
    await expectAppNavLinkReachable(page, "Releases");
    if (isDesktopAppNavViewport(page.viewportSize())) {
      await expect(
        page.getByRole("group", { name: "Collection view mode" }),
      ).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: "Select crate" }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("button", { name: /Open crate with/i }),
      ).toBeVisible();
    }
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_ONE }),
    ).toBeVisible();
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_TWO }),
    ).toBeVisible();
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_THREE }),
    ).toBeVisible();
  });
});

test.describe("authenticated releases crate menu (MSW)", () => {
  test("opening add to new crate closes the menu and shows the create dialog", async ({
    page,
  }) => {
    await gotoReleasesWorkspace(page);
    const card = releaseCardByAlbum(page, E2E_ALBUM_TWO);
    await openReleaseCrateMenuOnCard(card);

    await page.getByRole("menuitem", { name: "Add to new crate" }).click();

    await expect(page.getByTestId("fmdReleaseCrateMenu")).toHaveCount(0);
    await expect(
      page.getByRole("dialog", { name: "Add to new crate" }),
    ).toBeVisible();
  });

  test.describe("mobile layout", { tag: E2E_TAG_MOBILE_ONLY }, () => {
    test.beforeEach(async ({ page }) => {
      await gotoReleasesWorkspace(page);
    });

    test("mobile card portals the crate menu outside the clipped card shell", async ({
      page,
    }) => {
      const card = releaseCardByAlbum(page, E2E_ALBUM_ONE);
      await openReleaseCrateMenuOnCard(card);
      await expectCrateMenuPortaledOutsideCard(card);
      await expect(
        page.getByRole("menuitemcheckbox", { name: E2E_DEFAULT_CRATE_NAME }),
      ).toBeVisible();
    });

    test("mobile card toggles active crate membership from the menu", async ({
      page,
    }) => {
      const card = releaseCardByAlbum(page, E2E_ALBUM_ONE);
      const trigger = card.getByTestId("fmdReleaseCrateMenuTrigger");
      const activeCrateOption = page.getByRole("menuitemcheckbox", {
        name: E2E_DEFAULT_CRATE_NAME,
      });

      await expect(trigger).toHaveAttribute("aria-pressed", "true");

      await openReleaseCrateMenuOnCard(card);
      await activeCrateOption.click();
      await expect(trigger).toHaveAttribute("aria-pressed", "false");

      await activeCrateOption.click();
      await expect(trigger).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("fmdReleaseCrateMenu")).toBeVisible();
    });
  });

  test.describe("desktop layout", { tag: E2E_TAG_DESKTOP_ONLY }, () => {
    test.beforeEach(async ({ page }) => {
      await gotoReleasesWorkspace(page);
    });

    test("desktop grid keeps the crate menu inline while the collection scrolls", async ({
      page,
    }) => {
      const card = releaseCardByAlbum(page, E2E_ALBUM_ONE);
      await openReleaseCrateMenuOnCard(card);
      await expectCrateMenuInlineOnCard(card);

      await scrollReleasesCollection(page, 320);
      await expect(page.getByTestId("fmdReleaseCrateMenu")).toBeVisible();
      await expectCrateMenuInlineOnCard(card);
    });

    test("desktop list table portals the crate menu outside the clipped cell", async ({
      page,
    }) => {
      await switchCollectionView(page, "list");
      await expectListTableVisible(page);

      const row = releaseTableRowByAlbum(page, E2E_ALBUM_ONE);
      await openReleaseCrateMenuOnTableRow(row);
      await expectCrateMenuPortaledOutsideTableRow(row);
      await expect(
        page.getByRole("menuitemcheckbox", { name: E2E_DEFAULT_CRATE_NAME }),
      ).toBeVisible();
    });

    test("desktop list table keeps the portaled crate menu visible while scrolling", async ({
      page,
    }) => {
      await switchCollectionView(page, "list");
      await expectListTableVisible(page);

      const row = releaseTableRowByAlbum(page, E2E_ALBUM_ONE);
      await openReleaseCrateMenuOnTableRow(row);
      await expectCrateMenuPortaledOutsideTableRow(row);

      await scrollReleasesCollection(page, 320);
      await expect(page.getByTestId("fmdReleaseCrateMenu")).toBeVisible();
      await expectCrateMenuPortaledOutsideTableRow(row);
    });
  });
});
