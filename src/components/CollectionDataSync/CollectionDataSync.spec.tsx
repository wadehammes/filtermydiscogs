import { beforeEach, describe, expect, it } from "@jest/globals";

jest.mock("src/hooks/useCollectionData.hook", () => ({
  ...jest.requireActual("src/hooks/useCollectionData.hook"),
  useCollectionData: jest.fn(),
}));

import { CollectionDataSyncPageObject } from "src/components/CollectionDataSync/CollectionDataSync.po";
import { useCollectionData } from "src/hooks/useCollectionData.hook";

const mockUseCollectionData = jest.mocked(useCollectionData);

let po: CollectionDataSyncPageObject;

describe("CollectionDataSync", () => {
  beforeEach(() => {
    po = new CollectionDataSyncPageObject();
  });

  it("starts global collection pagination sync", () => {
    po.renderCollectionDataSync();

    expect(mockUseCollectionData).toHaveBeenCalled();
  });
});
