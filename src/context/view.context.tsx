"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { createContext, type PropsWithChildren, useContext } from "react";
import {
  type ViewActions,
  type ViewState,
  viewDispatchAtom,
  viewStateAtom,
} from "src/atoms/view.atoms";

export {
  type ViewActions,
  ViewActionTypes,
  type ViewMode,
} from "src/atoms/view.atoms";

const ViewScopeContext = createContext(false);

export const useViewScope = () => {
  const inProvider = useContext(ViewScopeContext);
  if (!inProvider) {
    throw new Error("useView must be used within a ViewProvider");
  }
};

export const ViewProvider = ({ children }: PropsWithChildren) => (
  <ViewScopeContext.Provider value={true}>{children}</ViewScopeContext.Provider>
);

export const useView = () => {
  useViewScope();

  const state = useAtomValue(viewStateAtom);
  const dispatch = useSetAtom(viewDispatchAtom);

  return { state, dispatch: dispatch as React.Dispatch<ViewActions> };
};

export type { ViewState };
