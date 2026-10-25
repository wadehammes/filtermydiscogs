import type { RequestHandler } from "msw";
import { createE2eReleaseByIdHandler } from "src/tests/msw/e2eReleaseHandlers";
import { createDefaultAuthHandlers } from "src/tests/msw/handlers/auth";
import { createDefaultPublicCrateApiHandlers } from "src/tests/msw/handlers/publicCrate";
import { createDefaultPublicPlaylistApiHandlers } from "src/tests/msw/handlers/publicPlaylist";
import { createDefaultTrackApiHandlers } from "src/tests/msw/handlers/tracks";
import { test as authenticatedTest, expect } from "./msw.fixture";

export const test = authenticatedTest.extend<{ handlers: RequestHandler[] }>({
  handlers: async ({ context: _context }, use) => {
    await use([
      ...createDefaultAuthHandlers(),
      ...createDefaultPublicCrateApiHandlers(),
      ...createDefaultPublicPlaylistApiHandlers(),
      createE2eReleaseByIdHandler(),
      ...createDefaultTrackApiHandlers(),
    ]);
  },
});

export { expect };
