import type { RequestHandler } from "msw";
import { createDefaultAuthHandlers } from "src/tests/msw/handlers/auth";
import { createDefaultPublicCrateApiHandlers } from "src/tests/msw/handlers/publicCrate";
import { test as authenticatedTest, expect } from "./msw.fixture";

export const test = authenticatedTest.extend<{ handlers: RequestHandler[] }>({
  handlers: async ({ context: _context }, use) => {
    await use([
      ...createDefaultAuthHandlers(),
      ...createDefaultPublicCrateApiHandlers(),
    ]);
  },
});

export { expect };
