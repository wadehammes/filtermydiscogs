"use client";

import { createContext, type ReactNode } from "react";
import type { DiscogsCollectionField } from "src/types";
import { useReleaseNotesCollectionFieldsSource } from "./useReleaseNotesCollectionFields.hook";

export type ReleaseNotesCollectionFieldsState = {
  fields: DiscogsCollectionField[];
  fieldsById: Map<number, DiscogsCollectionField>;
  isFieldsLoading: boolean;
};

export const ReleaseNotesCollectionFieldsContext =
  createContext<ReleaseNotesCollectionFieldsState | null>(null);

export const ReleaseNotesCollectionFieldsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const value = useReleaseNotesCollectionFieldsSource();

  return (
    <ReleaseNotesCollectionFieldsContext.Provider value={value}>
      {children}
    </ReleaseNotesCollectionFieldsContext.Provider>
  );
};

export { useReleaseNotesCollectionFields } from "./useReleaseNotesCollectionFields.hook";
