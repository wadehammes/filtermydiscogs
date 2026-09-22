import type { RequestHandler } from "msw";
import type { AuthStatus } from "src/services/auth.service";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { buildE2eCollectionReleases } from "src/tests/msw/e2eCollectionData";
import { createDefaultAuthHandlers } from "src/tests/msw/handlers/auth";
import { createDefaultCollectionApiHandlers } from "src/tests/msw/handlers/collection";
import { createDefaultCrateApiHandlers } from "src/tests/msw/handlers/crates";
import { createDefaultDashboardApiHandlers } from "src/tests/msw/handlers/dashboard";
import { createDefaultUserApiHandlers } from "src/tests/msw/handlers/user";

export function createAuthenticatedE2eHandlers(options?: {
  authStatus?: AuthStatus;
}): RequestHandler[] {
  const authStatus = options?.authStatus ?? authStatusFactory.authenticated();
  const username = authStatus.username ?? "testuser";
  const releases = buildE2eCollectionReleases();

  return [
    ...createDefaultAuthHandlers({ authStatus }),
    ...createDefaultCrateApiHandlers({ releases }),
    ...createDefaultCollectionApiHandlers({ username, releases }),
    ...createDefaultDashboardApiHandlers({ releases }),
    ...createDefaultUserApiHandlers(),
  ];
}
