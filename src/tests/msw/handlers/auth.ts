import { HttpResponse, http } from "msw";
import type { AuthStatus } from "src/services/auth.service";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { mutationSuccessFactory } from "src/tests/factories/MutationSuccess.factory";

export function createDefaultAuthHandlers(options?: {
  authStatus?: AuthStatus;
}) {
  let authStatus = options?.authStatus ?? authStatusFactory.unauthenticated();

  const signOut = () => {
    authStatus = authStatusFactory.unauthenticated();
  };

  return [
    http.get("/api/auth/check", () => HttpResponse.json(authStatus)),
    http.post("/api/auth/logout", () => {
      signOut();
      return HttpResponse.json(mutationSuccessFactory.build());
    }),
    http.post("/api/auth/clear-data", () => {
      signOut();
      return HttpResponse.json(mutationSuccessFactory.build());
    }),
  ];
}
