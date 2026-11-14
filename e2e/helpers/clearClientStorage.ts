import type { BrowserContext } from "@playwright/test";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  COLLECTION_CACHE_DB_NAME,
  SIMILAR_PAGE_INDEX_SESSION_KEY,
} from "src/constants/storageKeys";

const PRESERVED_E2E_SESSION_STORAGE_KEYS = [
  SIMILAR_PAGE_INDEX_SESSION_KEY,
] as const;

export async function installClearClientStorage(context: BrowserContext) {
  await context.addInitScript(
    ({ analyticsConsentKey, dbName, preservedSessionKeys }) => {
      const preservedSessionValues: Record<string, string> = {};

      for (const key of preservedSessionKeys) {
        const value = sessionStorage.getItem(key);

        if (value !== null) {
          preservedSessionValues[key] = value;
        }
      }

      localStorage.clear();
      sessionStorage.clear();

      for (const [key, value] of Object.entries(preservedSessionValues)) {
        sessionStorage.setItem(key, value);
      }
      indexedDB.deleteDatabase(dbName);
      localStorage.setItem(analyticsConsentKey, "denied");
    },
    {
      analyticsConsentKey: ANALYTICS_CONSENT_STORAGE_KEY,
      dbName: COLLECTION_CACHE_DB_NAME,
      preservedSessionKeys: [...PRESERVED_E2E_SESSION_STORAGE_KEYS],
    },
  );
}
