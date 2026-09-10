import { beforeEach, describe, expect, it } from "@jest/globals";
import { CollectionDataSyncPageObject } from "src/components/CollectionDataSync/CollectionDataSync.po";

let po: CollectionDataSyncPageObject;

describe("CollectionDataSync", () => {
  beforeEach(() => {
    po = new CollectionDataSyncPageObject();
  });

  it("starts global collection pagination sync", () => {
    po.renderCollectionDataSync();

    expect(po.mockUseCollectionData).toHaveBeenCalled();
  });
});
