"use client";

import { createContext, useContext } from "react";
import type { useReleaseNotesEditor } from "./useReleaseNotesEditor.hook";

export type ReleaseNotesEditorState = ReturnType<typeof useReleaseNotesEditor>;

export const ReleaseNotesEditorContext =
  createContext<ReleaseNotesEditorState | null>(null);

export const useReleaseNotesEditorContext = (): ReleaseNotesEditorState => {
  const context = useContext(ReleaseNotesEditorContext);

  if (!context) {
    throw new Error(
      "useReleaseNotesEditorContext must be used within ReleaseNotesEditorProvider",
    );
  }

  return context;
};
