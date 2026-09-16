"use client";

import { useContext } from "react";
import type {
  CrateActions,
  CrateContextType,
  CrateState,
} from "src/context/crate.context.types";
import {
  CrateActionsContext,
  CrateStateContext,
} from "src/context/crateContexts";

export type {
  CrateActions,
  CrateContextType,
  CrateState,
} from "src/context/crate.context.types";

export { CrateProvider } from "./CrateProvider.component";

export const useCrateState = (): CrateState => {
  const context = useContext(CrateStateContext);
  if (context === undefined) {
    throw new Error("useCrateState must be used within a CrateProvider");
  }
  return context;
};

export const useCrateActions = (): CrateActions => {
  const context = useContext(CrateActionsContext);
  if (context === undefined) {
    throw new Error("useCrateActions must be used within a CrateProvider");
  }
  return context;
};

export const useCrate = (): CrateContextType => {
  const state = useContext(CrateStateContext);
  const actions = useContext(CrateActionsContext);
  if (state === undefined || actions === undefined) {
    throw new Error("useCrate must be used within a CrateProvider");
  }
  return { ...state, ...actions };
};
