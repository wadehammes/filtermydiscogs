import type { RequestHandler } from "msw";
import { createDefaultAuthHandlers } from "src/tests/msw/handlers/auth";
import { createDefaultPublicCrateApiHandlers } from "src/tests/msw/handlers/publicCrate";
import { createDefaultPublicPlaylistApiHandlers } from "src/tests/msw/handlers/publicPlaylist";
import { createDefaultReleaseApiHandlers } from "src/tests/msw/handlers/release";
import { createDefaultTrackApiHandlers } from "src/tests/msw/handlers/tracks";
import { test as authenticatedTest, expect } from "./msw.fixture";

export const test = authenticatedTest.extend<{ handlers: RequestHandler[] }>({
  handlers: async ({ context: _context }, use) => {
    await use([
      ...createDefaultAuthHandlers(),
      ...createDefaultPublicCrateApiHandlers(),
      ...createDefaultPublicPlaylistApiHandlers(),
      ...createDefaultReleaseApiHandlers(),
      ...createDefaultTrackApiHandlers(),
    ]);
  },
});

export { expect };
