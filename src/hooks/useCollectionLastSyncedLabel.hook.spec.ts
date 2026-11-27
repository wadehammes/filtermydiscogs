import { describe, expect, it } from "@jest/globals";
import { useCollectionLastSyncedLabel } from "src/hooks/useCollectionLastSyncedLabel.hook";
import { renderFeatureHook } from "test-utils";

describe("useCollectionLastSyncedLabel", () => {
  it("when collection context is still loading, returns syncing copy", () => {
    const { result } = renderFeatureHook(
      () => useCollectionLastSyncedLabel({ username: "fan" }),
      { includeCollectionSync: false },
    );

    expect(result.current).toBe("Syncing collection with Discogs…");
  });
});
