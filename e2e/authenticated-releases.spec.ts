import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  E2E_DEFAULT_CRATE_NAME,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectAppNavLinkReachable } from "./helpers/appNavigation";
import {
  e2eReleaseCards,
  expectE2eCollectionLoaded,
  expectNotOnLogin,
} from "./helpers/authenticatedExpectations";
import {
  expectCrateMenuInlineOnCard,
  expectCrateMenuPortaledOutsideCard,
  openReleaseCrateMenuOnCard,
  releaseCardByAlbum,
  scrollReleasesCollection,
} from "./helpers/releaseCrateMenu";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated releases (MSW)", () => {
  test("renders releases workspace after collection loads", async ({
    page,
  }) => {
    await page.goto("/releases");

    await expect(page).toHaveURL(/\/releases/);
    await expectNotOnLogin(page);
    await expectAppNavLinkReachable(page, "Releases");
    await expectE2eCollectionLoaded(page);
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

  test.describe("mobile layout", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(
        isDesktopAppNavViewport(page.viewportSize()),
        "mobile list-card layout only",
      );
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

  test.describe("desktop layout", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(
        !isDesktopAppNavViewport(page.viewportSize()),
        "desktop grid layout only",
      );
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
  });
});
