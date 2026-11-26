import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE } from "src/constants/publicPlaylist.constants";
import { E2E_RELEASE_TRACK_POSITION } from "src/tests/msw/e2eReleaseDetailData";
import {
  createE2ePartialThenRemainderReleaseBatchHandler,
  createE2eTransient503ThenOkReleaseBatchHandler,
} from "src/tests/msw/e2eReleaseHandlers";
import {
  E2E_DISCOGS_RELEASE_ID_TWO,
  E2E_TRACK_ONE,
} from "src/tests/msw/e2eSession.constants";
import { formatTrackPositionTitle } from "src/utils/userTrack";
import { expect, test } from "./fixtures/publicMsw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";
import {
  stubE2eDemoPublicPlaylistMissingDisplayArt,
  waitForDiscogsReleaseBatch503ThenSuccess,
  waitForDiscogsReleaseBatchPosts,
} from "./helpers/discogsReleaseBatchResilience";
import { gotoPublicDemoPlaylist } from "./helpers/publicPlaylist";

test.describe("public shared playlist (MSW)", () => {
  test("loads the demo public playlist without login", async ({ page }) => {
    await gotoPublicDemoPlaylist(page);
    await expectNotOnLogin(page);
    await expect(page.getByTestId("fmdPublicSharedViewBanner")).toHaveText(
      /Public playlist · Shared by testuser/i,
    );
    await expect(
      page.getByRole("list", {
        name: `${LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE} tracklist`,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        formatTrackPositionTitle(E2E_RELEASE_TRACK_POSITION, E2E_TRACK_ONE),
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Learn more" }),
    ).toHaveAttribute("href", "/about");
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

  test("posts a follow-up batch after a partial release map", async ({
    page,
    network,
  }) => {
    stubE2eDemoPublicPlaylistMissingDisplayArt(network);
    network.use(createE2ePartialThenRemainderReleaseBatchHandler());

    const multiIdBatch = page.waitForRequest(
      (request) => {
        if (
          !request.url().includes("/api/release/batch") ||
          request.method() !== "POST"
        ) {
          return false;
        }

        const ids = (
          JSON.parse(request.postData() ?? "{}") as { ids?: string[] }
        ).ids;

        return (ids?.length ?? 0) > 1;
      },
      { timeout: 45_000 },
    );
    const remainderBatch = page.waitForRequest(
      (request) => {
        if (
          !request.url().includes("/api/release/batch") ||
          request.method() !== "POST"
        ) {
          return false;
        }

        const ids = (
          JSON.parse(request.postData() ?? "{}") as { ids?: string[] }
        ).ids;

        return (
          ids?.length === 1 && ids[0] === String(E2E_DISCOGS_RELEASE_ID_TWO)
        );
      },
      { timeout: 45_000 },
    );

    await gotoPublicDemoPlaylist(page);

    await Promise.all([multiIdBatch, remainderBatch]);

    await expect(
      page.getByRole("list", {
        name: `${LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE} tracklist`,
      }),
    ).toBeVisible();
  });

  test("hydrates art after transient 503 on release batch", async ({
    page,
    network,
  }) => {
    stubE2eDemoPublicPlaylistMissingDisplayArt(network);
    network.use(createE2eTransient503ThenOkReleaseBatchHandler(0));

    const batchRetrySequence = waitForDiscogsReleaseBatch503ThenSuccess(page);
    const batchPosts = waitForDiscogsReleaseBatchPosts(page, 2);

    await gotoPublicDemoPlaylist(page);

    await batchRetrySequence;
    await batchPosts;

    await page.getByRole("button", { name: "Play All" }).click();

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
