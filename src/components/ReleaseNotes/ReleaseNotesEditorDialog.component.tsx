"use client";

import type { DiscogsRelease } from "src/types";
import { NoteEditDialog } from "./NoteEditDialog.component";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";

interface ReleaseNotesEditorDialogProps {
  release: DiscogsRelease;
}

export const ReleaseNotesEditorDialog = ({
  release,
}: ReleaseNotesEditorDialogProps) => {
  const {
    closeDialog,
    errorMessage,
    fields,
    handleSave,
    hasNotes,
    isDialogOpen,
    isSaving,
  } = useReleaseNotesEditorContext();

  return (
    <NoteEditDialog
      isOpen={isDialogOpen}
      release={release}
      fields={fields}
      isSaving={isSaving}
      errorMessage={errorMessage}
      title={hasNotes ? "Edit release notes" : "Add release notes"}
      onClose={closeDialog}
      onSave={handleSave}
    />
  );
};
