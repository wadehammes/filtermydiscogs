import type { NetworkFixture } from "@msw/playwright";
import type { Page } from "@playwright/test";
import { createE2eDemoPublicPlaylistMissingDisplayArtHandlers } from "src/tests/msw/handlers/publicPlaylist";

export const stubE2eDemoPublicPlaylistMissingDisplayArt = (
  network: NetworkFixture,
) => network.use(...createE2eDemoPublicPlaylistMissingDisplayArtHandlers());

const isDiscogsReleaseBatchPost = (url: string, method: string) =>
  url.includes("/api/release/batch") && method === "POST";

export const waitForDiscogsReleaseBatchPosts = (page: Page, count: number) =>
  Promise.all(
    Array.from({ length: count }, () =>
      page.waitForRequest(
        (request) => isDiscogsReleaseBatchPost(request.url(), request.method()),
        { timeout: 45_000 },
      ),
    ),
  );

export const waitForDiscogsReleaseBatch503ThenSuccess = async (page: Page) => {
  await page.waitForResponse(
    (response) =>
      response.url().includes("/api/release/batch") &&
      response.status() === 503,
    { timeout: 45_000 },
  );

  await page.waitForResponse(
    (response) =>
      response.url().includes("/api/release/batch") && response.ok(),
    { timeout: 60_000 },
  );
};
