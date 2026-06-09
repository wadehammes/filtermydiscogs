import type { QueryClient } from "@tanstack/react-query";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";

/** Remove cached user data but keep the auth session query (avoids post-login redirect flicker). */
export function clearUserScopedQueries(queryClient: QueryClient): void {
  const authKey = AuthQueryKeys.all()[0];

  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== authKey,
  });
}
