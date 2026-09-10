import { beforeEach, describe, expect, it } from "@jest/globals";
import { CollectionCachePrepGatePageObject } from "src/components/CollectionCachePrepGate/CollectionCachePrepGate.po";

let po: CollectionCachePrepGatePageObject;

describe("CollectionCachePrepGate", () => {
  beforeEach(() => {
    po = new CollectionCachePrepGatePageObject();
    po.mockUseCollectionCacheReady.mockClear();
  });

  it("prefetches IndexedDB cache for a soft-logout reconnect username", () => {
    po.renderCollectionCachePrepGate({
      reconnectUsername: "crate-digger",
    });

    expect(po.mockUseCollectionCacheReady).toHaveBeenCalledWith({
      username: "crate-digger",
      enabled: true,
    });
  });

  it("does not prefetch when there is no username candidate", () => {
    po.renderCollectionCachePrepGate();

    expect(po.mockUseCollectionCacheReady).toHaveBeenCalledWith({
      username: "",
      enabled: false,
    });
  });
});
