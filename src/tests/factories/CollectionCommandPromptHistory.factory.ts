import { faker } from "@faker-js/faker";
import { buildCollectionCommandPromptsStorageKey } from "src/constants/storageKeys";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";
import type { CollectionCommandPromptHistoryEntry } from "src/utils/collectionCommandPromptHistory";

type CollectionCommandPromptHistoryFactoryOptions = Record<string, never>;

class CollectionCommandPromptHistoryFactory extends BaseFactory<
  CollectionCommandPromptHistoryEntry,
  CollectionCommandPromptHistoryFactoryOptions
> {
  build(
    attributes?: Partial<CollectionCommandPromptHistoryEntry>,
    _options?: CollectionCommandPromptHistoryFactoryOptions,
  ): CollectionCommandPromptHistoryEntry {
    const instance = {
      prompt: faker.lorem.sentence({ min: 3, max: 8 }),
      usedAt: faker.date.recent().toISOString(),
    } satisfies CollectionCommandPromptHistoryEntry;

    const factoryBuilt: CollectionCommandPromptHistoryEntry = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      CollectionCommandPromptHistoryEntry,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  writeLocalStorage(
    userId: string,
    entries: CollectionCommandPromptHistoryEntry[],
  ): void {
    localStorage.setItem(
      buildCollectionCommandPromptsStorageKey(userId),
      JSON.stringify(entries),
    );
  }
}

export const collectionCommandPromptHistoryFactory =
  new CollectionCommandPromptHistoryFactory();
