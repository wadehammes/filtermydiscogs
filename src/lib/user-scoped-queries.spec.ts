import { describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import {
  AuthQueryKeys,
  CratesQueryKeys,
  PublicCrateQueryKeys,
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

  it("preserves public crate queries", () => {
    const queryClient = new QueryClient();
    const crateId = "ab65c378-fab9-42c0-96bb-c308d413cbbb";

    queryClient.setQueryData(AuthQueryKeys.all(), {
      isAuthenticated: false,
      username: null,
      userId: null,
      reconnectUsername: null,
      rateLimited: false,
    });
    queryClient.setQueryData(PublicCrateQueryKeys.byId(crateId), {
      crate: { id: crateId, name: "Shared" },
    });
    queryClient.setQueryData(CratesQueryKeys.byUserId("123"), {
      crates: [],
    });

    clearUserScopedQueries(queryClient);

    expect(
      queryClient.getQueryData(PublicCrateQueryKeys.byId(crateId)),
    ).toEqual({
      crate: { id: crateId, name: "Shared" },
    });
    expect(
      queryClient.getQueryData(CratesQueryKeys.byUserId("123")),
    ).toBeUndefined();
  });
});
