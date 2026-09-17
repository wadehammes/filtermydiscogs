import { describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import { CrateQueryKeys } from "src/hooks/queries/querykeys.constants";
import { crateQueryFilterKey } from "src/lib/crateQueryFilterKey";

describe("crateQueryFilterKey", () => {
  it("crateQueryFilterKey returns byUserAndId when crateId is a non-empty string", () => {
    expect(crateQueryFilterKey("1", "crate-a")).toEqual(
      CrateQueryKeys.byUserAndId("1", "crate-a"),
    );
  });

  it("crateQueryFilterKey returns byUserId when crateId is null, undefined, or omitted", () => {
    expect(crateQueryFilterKey("1", null)).toEqual(
      CrateQueryKeys.byUserId("1"),
    );
    expect(crateQueryFilterKey("1", undefined)).toEqual(
      CrateQueryKeys.byUserId("1"),
    );
    expect(crateQueryFilterKey("1")).toEqual(CrateQueryKeys.byUserId("1"));
  });

  it("partial invalidateQueries with a trailing undefined segment does not invalidate a shorter crate key", async () => {
    const queryClient = new QueryClient();
    const byUserKey = CrateQueryKeys.byUserId("1");

    queryClient.setQueryData(byUserKey, { marker: "list" });

    await queryClient.invalidateQueries({
      queryKey: ["crate", "1", undefined],
    });

    expect(queryClient.getQueryData(byUserKey)).toEqual({ marker: "list" });
    expect(queryClient.getQueryState(byUserKey)?.isInvalidated).not.toBe(true);
  });

  it("partial invalidateQueries with byUserId still invalidates the matching crate list key", async () => {
    const queryClient = new QueryClient();
    const byUserKey = CrateQueryKeys.byUserId("1");

    queryClient.setQueryData(byUserKey, { marker: "list" });

    await queryClient.invalidateQueries({ queryKey: byUserKey });

    expect(queryClient.getQueryState(byUserKey)?.isInvalidated).toBe(true);
  });
});
