import { defineNetworkFixture, type NetworkFixture } from "@msw/playwright";
import { test as base, expect } from "@playwright/test";
import type { RequestHandler } from "msw";
import { createAuthenticatedE2eHandlers } from "src/tests/msw/createAuthenticatedE2eHandlers";
import { installClearClientStorage } from "../helpers/clearClientStorage";

type MswFixtures = {
  handlers: RequestHandler[];
  network: NetworkFixture;
};

function onUnhandledApiRequest(request: Request, print: { error: () => void }) {
  const { pathname } = new URL(request.url);

  if (!pathname.startsWith("/api/")) {
    return;
  }

  print.error();
}

export const test = base.extend<MswFixtures>({
  context: async ({ context }, use) => {
    await installClearClientStorage(context);
    await use(context);
  },
  handlers: [createAuthenticatedE2eHandlers(), { option: true }],
  network: [
    async ({ context, handlers }, use) => {
      const network = defineNetworkFixture({
        context,
        handlers,
        onUnhandledRequest: onUnhandledApiRequest,
      });

      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
});

export { expect };
