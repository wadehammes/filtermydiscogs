import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { E2E_TRACK_ONE } from "src/tests/msw/e2eSession.constants";
import { formatTrackPositionTitle } from "src/utils/userTrack";
import { expect, test } from "./fixtures/publicMsw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";
import { gotoPublicDemoPlaylist } from "./helpers/publicPlaylist";

test.describe("public shared playlist (MSW)", () => {
  test("loads the demo public playlist without login", async ({ page }) => {
    await gotoPublicDemoPlaylist(page);
    await expectNotOnLogin(page);
    await expect(page.getByTestId("fmdPublicSharedViewBanner")).toHaveText(
      /Public playlist · Shared by testuser/i,
    );
    await expect(page.getByRole("heading", { name: "Tracks" })).toBeVisible();
    await expect(
      page.getByText(formatTrackPositionTitle("A1", E2E_TRACK_ONE)),
    ).toBeVisible();
    await expect(
      page.getByText(/share a public playlist link like this one/i),
    ).toBeVisible();
    await expect(
      page.getByText(/share a public crate link like this one/i),
    ).toHaveCount(0);
  });

  test("starts playback from Play All without a provider error", async ({
    page,
  }) => {
    await gotoPublicDemoPlaylist(page);
    await page.getByRole("button", { name: "Play All" }).click();

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
