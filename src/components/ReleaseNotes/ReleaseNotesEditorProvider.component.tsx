"use client";

import type { ReactNode } from "react";
import type { DiscogsRelease } from "src/types";
import { ReleaseNotesEditorContext } from "./ReleaseNotesEditorContext";
import { ReleaseNotesEditorDialog } from "./ReleaseNotesEditorDialog.component";
import { useReleaseNotesEditor } from "./useReleaseNotesEditor.hook";

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
