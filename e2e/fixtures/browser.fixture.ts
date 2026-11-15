import { test as base, expect } from "@playwright/test";
import { installHideNextDevOverlay } from "../helpers/hideNextDevOverlay";

export const test = base.extend({
  context: async ({ context }, use) => {
    await installHideNextDevOverlay(context);
    await use(context);
  },
});

export { expect };
