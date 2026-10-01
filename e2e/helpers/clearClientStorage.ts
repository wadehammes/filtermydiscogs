import type { BrowserContext } from "@playwright/test";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  COLLECTION_CACHE_DB_NAME,
} from "src/constants/storageKeys";

export async function installClearClientStorage(context: BrowserContext) {
  await context.addInitScript(
    ({ analyticsConsentKey, dbName }) => {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.deleteDatabase(dbName);
      localStorage.setItem(analyticsConsentKey, "denied");
    },
    {
      analyticsConsentKey: ANALYTICS_CONSENT_STORAGE_KEY,
      dbName: COLLECTION_CACHE_DB_NAME,
    },
  );
}
