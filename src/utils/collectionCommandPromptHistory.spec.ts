import { beforeEach, describe, expect, it } from "@jest/globals";
import { buildCollectionCommandPromptsStorageKey } from "src/constants/storageKeys";
import { collectionCommandPromptHistoryFactory } from "src/tests/factories/CollectionCommandPromptHistory.factory";
import {
  clearCollectionCommandPromptHistory,
  readCollectionCommandPromptHistory,
} from "src/utils/collectionCommandPromptHistory";

const userId = "user-123";

describe("clearCollectionCommandPromptHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes stored prompts for the given user", () => {
    collectionCommandPromptHistoryFactory.writeLocalStorage(
      userId,
      collectionCommandPromptHistoryFactory.buildList(2),
    );

    clearCollectionCommandPromptHistory(userId);

    expect(readCollectionCommandPromptHistory(userId)).toEqual([]);
    expect(
      localStorage.getItem(buildCollectionCommandPromptsStorageKey(userId)),
    ).toBeNull();
  });

  it("no-ops when userId is missing", () => {
    collectionCommandPromptHistoryFactory.writeLocalStorage(
      userId,
      collectionCommandPromptHistoryFactory.buildList(1),
    );

    clearCollectionCommandPromptHistory(null);

    expect(readCollectionCommandPromptHistory(userId)).toHaveLength(1);
  });
});
