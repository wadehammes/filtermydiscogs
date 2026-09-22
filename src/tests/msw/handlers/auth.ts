import { HttpResponse, http } from "msw";
import type { AuthStatus } from "src/services/auth.service";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { mutationSuccessFactory } from "src/tests/factories/MutationSuccess.factory";

export function createDefaultAuthHandlers(options?: {
  authStatus?: AuthStatus;
}) {
  const authStatus = options?.authStatus ?? authStatusFactory.unauthenticated();

  return [
    http.get("/api/auth/check", () => HttpResponse.json(authStatus)),
    http.post("/api/auth/logout", () =>
      HttpResponse.json(mutationSuccessFactory.build()),
    ),
    http.post("/api/auth/clear-data", () =>
      HttpResponse.json(mutationSuccessFactory.build()),
    ),
  ];
}
