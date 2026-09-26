import type { QueryClient } from "@tanstack/react-query";
import {
  AuthQueryKeys,
  BuildVersionQueryKeys,
  PublicCrateQueryKeys,
} from "src/hooks/queries/querykeys.constants";

const PRESERVED_QUERY_ROOTS = new Set<string>([
  AuthQueryKeys.all()[0],
  PublicCrateQueryKeys.byId("")[0],
  BuildVersionQueryKeys.all()[0],
]);

const isPreservedQueryKey = (queryKey: readonly unknown[]): boolean =>
  typeof queryKey[0] === "string" && PRESERVED_QUERY_ROOTS.has(queryKey[0]);

export function clearUserScopedQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => !isPreservedQueryKey(query.queryKey),
  });
}
