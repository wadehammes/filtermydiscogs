import { COLLECTION_COMMAND_PROMPT_HISTORY_MAX } from "src/constants/collectionCommand.constants";
import {
  buildCollectionCommandPromptsStorageKey,
  COLLECTION_COMMAND_PROMPTS_STORAGE_KEY,
} from "src/constants/storageKeys";

export type CollectionCommandPromptHistoryEntry = {
  prompt: string;
  usedAt: string;
};

const parseHistory = (
  storedJson: string | null,
): CollectionCommandPromptHistoryEntry[] => {
  if (!storedJson) {
    return [];
  }

  try {
    const decoded: unknown = JSON.parse(storedJson);
    if (!Array.isArray(decoded)) {
      return [];
    }

    return decoded.filter(
      (entry): entry is CollectionCommandPromptHistoryEntry => {
        if (!entry || typeof entry !== "object") {
          return false;
        }

        const candidate = entry as Partial<CollectionCommandPromptHistoryEntry>;
        return (
          typeof candidate.prompt === "string" &&
          candidate.prompt.trim().length > 0 &&
          typeof candidate.usedAt === "string"
        );
      },
    );
  } catch {
    return [];
  }
};

export const readCollectionCommandPromptHistory = (
  userId: string | null,
): CollectionCommandPromptHistoryEntry[] => {
  if (typeof window === "undefined" || !userId) {
    return [];
  }

  const storageKey = buildCollectionCommandPromptsStorageKey(userId);
  return parseHistory(window.localStorage.getItem(storageKey));
};

export const writeCollectionCommandPromptHistory = (
  userId: string | null,
  entries: CollectionCommandPromptHistoryEntry[],
): void => {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  const storageKey = buildCollectionCommandPromptsStorageKey(userId);
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(entries.slice(0, COLLECTION_COMMAND_PROMPT_HISTORY_MAX)),
  );
};

export const recordCollectionCommandPromptHistory = ({
  userId,
  prompt,
}: {
  userId: string | null;
  prompt: string;
}): void => {
  const trimmed = prompt.trim();
  if (!(trimmed && userId)) {
    return;
  }

  const current = readCollectionCommandPromptHistory(userId);
  const withoutDuplicate = current.filter(
    (entry) => entry.prompt.toLowerCase() !== trimmed.toLowerCase(),
  );

  const next: CollectionCommandPromptHistoryEntry[] = [
    { prompt: trimmed, usedAt: new Date().toISOString() },
    ...withoutDuplicate,
  ].slice(0, COLLECTION_COMMAND_PROMPT_HISTORY_MAX);

  writeCollectionCommandPromptHistory(userId, next);
};

export const clearAllCollectionCommandPromptHistories = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const storageKey = window.localStorage.key(index);
    if (storageKey?.startsWith(COLLECTION_COMMAND_PROMPTS_STORAGE_KEY)) {
      window.localStorage.removeItem(storageKey);
    }
  }
};
