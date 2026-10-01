import { defineNetworkFixture, type NetworkFixture } from "@msw/playwright";
import { test as base, expect } from "@playwright/test";
import type { RequestHandler, UnhandledFrameHandle } from "msw";
import { HttpNetworkFrame } from "msw/experimental";
import { createAuthenticatedE2eHandlers } from "src/tests/msw/createAuthenticatedE2eHandlers";
import { installClearClientStorage } from "../helpers/clearClientStorage";

type MswFixtures = {
  handlers: RequestHandler[];
  network: NetworkFixture;
};

const isFilterMyDiscogsApiRequest = (requestUrl: string): boolean => {
  let parsed: URL;

  try {
    parsed = new URL(requestUrl);
  } catch {
    return false;
  }

  if (!parsed.pathname.startsWith("/api/")) {
    return false;
  }

  return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
};

const onUnhandledApiFrame: UnhandledFrameHandle = ({ frame, defaults }) => {
  if (!(frame instanceof HttpNetworkFrame)) {
    return;
  }

  if (!isFilterMyDiscogsApiRequest(frame.data.request.url)) {
    return;
  }

  defaults.error();
};

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
        onUnhandledFrame: onUnhandledApiFrame,
      });

      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
});

export { expect };
