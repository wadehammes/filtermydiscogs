"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { DiscogsRelease } from "src/types";
import { ReleaseNotesEditorDialog } from "./ReleaseNotesEditorDialog.component";
import { useReleaseNotesEditor } from "./useReleaseNotesEditor.hook";

type ReleaseNotesEditorState = ReturnType<typeof useReleaseNotesEditor>;

const ReleaseNotesEditorContext = createContext<ReleaseNotesEditorState | null>(
  null,
);

interface ReleaseNotesEditorProviderProps {
  release: DiscogsRelease;
  children: ReactNode;
}

export const ReleaseNotesEditorProvider = ({
  release,
  children,
}: ReleaseNotesEditorProviderProps) => {
  const editor = useReleaseNotesEditor(release);

  return (
    <ReleaseNotesEditorContext.Provider value={editor}>
      {children}
      <ReleaseNotesEditorDialog release={release} />
    </ReleaseNotesEditorContext.Provider>
  );
};

export const useReleaseNotesEditorContext = (): ReleaseNotesEditorState => {
  const context = useContext(ReleaseNotesEditorContext);

  if (!context) {
    throw new Error(
      "useReleaseNotesEditorContext must be used within ReleaseNotesEditorProvider",
    );
  }

  return context;
};
