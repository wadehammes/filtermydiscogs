"use client";

import { createContext } from "react";
import type {
  CrateActions,
  CrateState,
} from "src/context/crate.context.types";

export const CrateStateContext = createContext<CrateState | undefined>(
  undefined,
);
export const CrateActionsContext = createContext<CrateActions | undefined>(
  undefined,
);
