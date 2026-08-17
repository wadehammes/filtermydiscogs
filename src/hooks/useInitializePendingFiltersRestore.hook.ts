"use client";

import { useStore } from "jotai";
import { useEffect } from "react";
import {
  pendingFiltersRestoreAtom,
  pendingFiltersRestoreDismissedAtom,
  persistedFiltersAtom,
  sessionFiltersAtom,
} from "src/atoms/filters.atoms";
import { getFilterPersistenceEnabled } from "src/utils/filterPersistence";
import {
  defaultPersistedFilters,
  hasRestorableFilterSelections,
  persistedFiltersEqual,
} from "src/utils/filtersStorage";

export const useInitializePendingFiltersRestore = () => {
  const store = useStore();

  useEffect(() => {
    const maybeOfferRestore = () => {
      if (!getFilterPersistenceEnabled()) {
        return;
      }

      if (store.get(pendingFiltersRestoreDismissedAtom)) {
        return;
      }

      const session = store.get(sessionFiltersAtom);
      if (!persistedFiltersEqual(session, defaultPersistedFilters)) {
        return;
      }

      if (store.get(pendingFiltersRestoreAtom)) {
        return;
      }

      const persisted = store.get(persistedFiltersAtom);
      if (!hasRestorableFilterSelections(persisted)) {
        return;
      }

      store.set(pendingFiltersRestoreAtom, { ...persisted });
    };

    maybeOfferRestore();
    return store.sub(persistedFiltersAtom, maybeOfferRestore);
  }, [store]);
};
