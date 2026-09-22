import type { BrowserContext } from "@playwright/test";
import { COLLECTION_CACHE_DB_NAME } from "src/constants/storageKeys";

export async function installClearClientStorage(context: BrowserContext) {
  await context.addInitScript((dbName) => {
    localStorage.clear();
    sessionStorage.clear();
    indexedDB.deleteDatabase(dbName);
  }, COLLECTION_CACHE_DB_NAME);
}
