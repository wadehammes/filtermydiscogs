import { describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import {
  AuthQueryKeys,
  CratesQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import { clearUserScopedQueries } from "./user-scoped-queries";

describe("clearUserScopedQueries", () => {
  it("removes user-scoped queries but preserves auth", () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(AuthQueryKeys.all(), {
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      reconnectUsername: null,
      rateLimited: false,
    });
    queryClient.setQueryData(CratesQueryKeys.byUserId("123"), {
      crates: [],
    });

    clearUserScopedQueries(queryClient);

    expect(queryClient.getQueryData(AuthQueryKeys.all())).toEqual({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      reconnectUsername: null,
      rateLimited: false,
    });
    expect(
      queryClient.getQueryData(CratesQueryKeys.byUserId("123")),
    ).toBeUndefined();
  });
});
