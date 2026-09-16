"use client";

import type { ReactNode } from "react";
import {
  CrateActionsContext,
  CrateStateContext,
} from "src/context/crateContexts";
import { useCrateProvider } from "src/hooks/useCrateProvider.hook";

interface CrateProviderProps {
  children: ReactNode;
}

export const CrateProvider = ({ children }: CrateProviderProps) => {
  const { stateValue, actionsValue } = useCrateProvider();

  return (
    <CrateStateContext.Provider value={stateValue}>
      <CrateActionsContext.Provider value={actionsValue}>
        {children}
      </CrateActionsContext.Provider>
    </CrateStateContext.Provider>
  );
};
