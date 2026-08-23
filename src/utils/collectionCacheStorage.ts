import {
  COLLECTION_CACHE_DB_NAME,
  COLLECTION_CACHE_STORE_NAME,
} from "src/constants/storageKeys";
import type { DiscogsCollection } from "src/types";
import type { CollectionPageParam } from "src/utils/collectionPagination";

export interface PersistedCollectionCache {
  pages: DiscogsCollection[];
  pageParams: CollectionPageParam[];
  totalItems: number;
  fetchedAt: number;
}

const COLLECTION_CACHE_DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function normalizeCollectionCacheUsername(username: string): string {
  return username.trim().toLowerCase();
}

function openCollectionCacheDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(
      COLLECTION_CACHE_DB_NAME,
      COLLECTION_CACHE_DB_VERSION,
    );

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error("Failed to open collection cache"));
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(COLLECTION_CACHE_STORE_NAME)) {
        database.createObjectStore(COLLECTION_CACHE_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        dbPromise = null;
      };
      resolve(database);
    };
  });

  return dbPromise;
}

function runCollectionCacheTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openCollectionCacheDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(
          COLLECTION_CACHE_STORE_NAME,
          mode,
        );
        const store = transaction.objectStore(COLLECTION_CACHE_STORE_NAME);
        const request = work(store);

        request.onerror = () => {
          reject(request.error ?? new Error("Collection cache request failed"));
        };

        transaction.oncomplete = () => {
          resolve(request.result);
        };

        transaction.onerror = () => {
          reject(
            transaction.error ??
              new Error("Collection cache transaction failed"),
          );
        };
      }),
  );
}

export function parsePersistedCollectionCache(
  value: unknown,
): PersistedCollectionCache | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<PersistedCollectionCache>;
  if (
    !(Array.isArray(record.pages) && Array.isArray(record.pageParams)) ||
    typeof record.totalItems !== "number" ||
    !Number.isFinite(record.totalItems) ||
    typeof record.fetchedAt !== "number" ||
    !Number.isFinite(record.fetchedAt)
  ) {
    return null;
  }

  if (record.pages.length === 0 || record.pageParams.length === 0) {
    return null;
  }

  return {
    pages: record.pages,
    pageParams: record.pageParams,
    totalItems: record.totalItems,
    fetchedAt: record.fetchedAt,
  };
}

export async function readPersistedCollectionCache(
  username: string,
): Promise<PersistedCollectionCache | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  try {
    const cacheKey = normalizeCollectionCacheUsername(username);
    const stored = await runCollectionCacheTransaction("readonly", (store) =>
      store.get(cacheKey),
    );
    const parsed = parsePersistedCollectionCache(stored);
    return parsed;
  } catch {
    return null;
  }
}

export async function writePersistedCollectionCache(
  username: string,
  cache: PersistedCollectionCache,
): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  try {
    const cacheKey = normalizeCollectionCacheUsername(username);
    await runCollectionCacheTransaction("readwrite", (store) =>
      store.put(cache, cacheKey),
    );
  } catch {
    return;
  }
}

export async function clearPersistedCollectionCache(
  username: string,
): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  try {
    const cacheKey = normalizeCollectionCacheUsername(username);
    await runCollectionCacheTransaction("readwrite", (store) =>
      store.delete(cacheKey),
    );
  } catch {
    return;
  }
}

export async function clearPersistedCollectionCaches(): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  dbPromise = null;

  try {
    await runCollectionCacheTransaction("readwrite", (store) => store.clear());
  } catch {
    return;
  }
}
