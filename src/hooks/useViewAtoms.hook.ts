"use client";

import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useCallback } from "react";
import {
  currentViewAtom,
  previousViewAtom,
  type ViewActions,
  viewDispatchAtom,
  viewStateAtom,
} from "src/atoms/view.atoms";
import { useViewScope } from "src/context/view.context";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import { syncCollectionViewCookie } from "src/utils/collectionViewModeStorage";

export const useViewDispatch = () => {
  useViewScope();
  const store = useStore();
  const baseDispatch = useSetAtom(viewDispatchAtom);
  const { persistPreferences } = usePersistUserPreferences();

  return useCallback(
    (action: ViewActions) => {
      baseDispatch(action);
      const nextView = store.get(viewStateAtom);
      persistPreferences({ view: nextView });

      if (typeof document !== "undefined") {
        document.documentElement.setAttribute(
          "data-collection-view",
          nextView.currentView,
        );
        syncCollectionViewCookie(nextView.currentView);
      }
    },
    [baseDispatch, persistPreferences, store],
  );
};

export const useCurrentView = () => {
  useViewScope();

  return useAtomValue(currentViewAtom);
};

export const usePreviousView = () => {
  useViewScope();

  return useAtomValue(previousViewAtom);
};
