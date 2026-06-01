"use client";

import { Provider } from "jotai";
import type { ReactNode } from "react";

interface JotaiProviderProps {
  children: ReactNode;
}

export const JotaiProvider = ({ children }: JotaiProviderProps) => (
  <Provider>{children}</Provider>
);
