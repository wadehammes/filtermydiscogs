import { beforeEach, describe, expect, it } from "@jest/globals";
import { COLLECTION_ITEM_COUNTS_STORAGE_KEY } from "src/constants/storageKeys";
import {
  clearStoredCollectionItemCounts,
  persistCollectionItemCount,
  readStoredCollectionItemCount,
} from "./collectionItemCountStorage";

describe("collectionItemCountStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and reads collection size by username", () => {
    persistCollectionItemCount("Crate-Digger", 11_400);

    expect(readStoredCollectionItemCount("crate-digger")).toBe(11_400);
  });

  it("clears stored collection sizes", () => {
    persistCollectionItemCount("crate-digger", 500);
    clearStoredCollectionItemCounts();

    expect(localStorage.getItem(COLLECTION_ITEM_COUNTS_STORAGE_KEY)).toBeNull();
    expect(readStoredCollectionItemCount("crate-digger")).toBeNull();
  });
});
