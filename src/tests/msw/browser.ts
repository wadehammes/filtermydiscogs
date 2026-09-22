import { setupWorker } from "msw/browser";
import type { AuthStatus } from "src/services/auth.service";
import { createAuthenticatedE2eHandlers } from "src/tests/msw/createAuthenticatedE2eHandlers";

export const mswBrowserWorker = setupWorker(
  ...createAuthenticatedE2eHandlers(),
);

export function createAuthenticatedBrowserHandlers(options?: {
  authStatus?: AuthStatus;
}) {
  return createAuthenticatedE2eHandlers(options);
}
