"use client";

import type { ReactNode } from "react";
import { ReleaseNotesCollectionFieldsContext } from "./ReleaseNotesCollectionFieldsContext";
import { useReleaseNotesCollectionFieldsSource } from "./useReleaseNotesCollectionFields.hook";

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
