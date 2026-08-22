import { COLLECTION_ITEM_COUNTS_STORAGE_KEY } from "src/constants/storageKeys";

function readCollectionItemCounts(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const countsJson = localStorage.getItem(COLLECTION_ITEM_COUNTS_STORAGE_KEY);
    if (!countsJson) {
      return {};
    }

    const countsByUsername = JSON.parse(countsJson) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(countsByUsername).flatMap(([username, items]) =>
        typeof items === "number" && Number.isFinite(items)
          ? [[username, items]]
          : [],
      ),
    );
  } catch {
    return {};
  }
}

export function readStoredCollectionItemCount(username: string): number | null {
  const items = readCollectionItemCounts()[username.toLowerCase()];
  return items ?? null;
}

export function persistCollectionItemCount(
  username: string,
  items: number,
): void {
  if (typeof window === "undefined" || !Number.isFinite(items)) {
    return;
  }

  try {
    const counts = readCollectionItemCounts();
    counts[username.toLowerCase()] = items;
    localStorage.setItem(
      COLLECTION_ITEM_COUNTS_STORAGE_KEY,
      JSON.stringify(counts),
    );
  } catch {
    return;
  }
}

export function clearStoredCollectionItemCounts(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(COLLECTION_ITEM_COUNTS_STORAGE_KEY);
}
