"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useCrate, useCrateActions } from "src/context/crate.context";
import { useCurrentView } from "src/hooks/useViewAtoms.hook";
import { definedProps } from "src/utils/definedProps";
import { useCrateDrawerState } from "./useCrateDrawerState.hook";

interface CrateDrawerProviderProps {
  children: ReactNode;
  onReleaseClick?: (instanceId: string) => void;
}

type CrateDrawerContextValue = ReturnType<typeof useCrateDrawerState> & {
  currentView: ReturnType<typeof useCurrentView>;
  isPacked: ReturnType<typeof useCrate>["isPacked"];
  removeFromCrate: ReturnType<typeof useCrate>["removeFromCrate"];
  setPacked: ReturnType<typeof useCrate>["setPacked"];
  updateCrateLayout: ReturnType<typeof useCrateActions>["updateCrateLayout"];
  onReleaseClick?: (instanceId: string) => void;
};

const CrateDrawerContext = createContext<CrateDrawerContextValue | null>(null);

export const CrateDrawerProvider = ({
  children,
  onReleaseClick,
}: CrateDrawerProviderProps) => {
  const drawerState = useCrateDrawerState();
  const { isPacked, removeFromCrate, setPacked } = useCrate();
  const { updateCrateLayout } = useCrateActions();
  const currentView = useCurrentView();

  return (
    <CrateDrawerContext.Provider
      value={{
        ...drawerState,
        currentView,
        isPacked,
        removeFromCrate,
        setPacked,
        updateCrateLayout,
        ...definedProps({ onReleaseClick }),
      }}
    >
      {children}
    </CrateDrawerContext.Provider>
  );
};

export const useCrateDrawerContext = (): CrateDrawerContextValue => {
  const context = useContext(CrateDrawerContext);

  if (!context) {
    throw new Error(
      "useCrateDrawerContext must be used within CrateDrawerProvider",
    );
  }

  return context;
};
