"use client";

import { createContext } from "react";
import type { DiscogsCollectionField } from "src/types";

export type ReleaseNotesCollectionFieldsState = {
  fields: DiscogsCollectionField[];
  fieldsById: Map<number, DiscogsCollectionField>;
  isFieldsLoading: boolean;
};

export const ReleaseNotesCollectionFieldsContext =
  createContext<ReleaseNotesCollectionFieldsState | null>(null);
