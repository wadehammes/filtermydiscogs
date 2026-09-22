import { setupWorker } from "msw/browser";
import type { AuthStatus } from "src/services/auth.service";
import { createDefaultAuthHandlers } from "src/tests/msw/handlers/auth";
import { createDefaultCrateApiHandlers } from "src/tests/msw/handlers/crates";

export const mswBrowserWorker = setupWorker(
  ...createDefaultAuthHandlers(),
  ...createDefaultCrateApiHandlers(),
);

export function createAuthenticatedBrowserHandlers(options?: {
  authStatus?: AuthStatus;
}) {
  return [
    ...createDefaultAuthHandlers(options),
    ...createDefaultCrateApiHandlers(),
  ];
}
