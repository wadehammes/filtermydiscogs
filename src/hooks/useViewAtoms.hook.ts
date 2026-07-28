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

export const useViewDispatch = () => {
  useViewScope();
  const store = useStore();
  const baseDispatch = useSetAtom(viewDispatchAtom);
  const { persistPreferences } = usePersistUserPreferences();

  return useCallback(
    (action: ViewActions) => {
      baseDispatch(action);
      persistPreferences({ view: store.get(viewStateAtom) });
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
