import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useId, useMemo, useState } from "react";
import { AppDialog } from "src/components/AppDialog/AppDialog.component";
import Button from "src/components/Button/Button.component";
import {
  MAX_FILTER_VIEW_NAME_LENGTH,
  normalizeFilterViewName,
} from "src/utils/filterViews";
import styles from "./SaveFilterViewDialog.module.css";

export type FilterViewNameDialogMode = "save" | "rename";

export interface SaveFilterViewDialogProps {
  isOpen: boolean;
  isSaving?: boolean;
  mode?: FilterViewNameDialogMode;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => boolean;
}

const dialogCopy = {
  save: {
    title: "Save current view",
    description:
      "Save your current search, filters, and sort as a reusable view.",
    submitLabel: "Save view",
    loadingText: "Saving...",
  },
  rename: {
    title: "Rename view",
    description: "Change the name of this saved view.",
    submitLabel: "Save",
    loadingText: "Saving...",
  },
} as const;

export const SaveFilterViewDialog = ({
  isOpen,
  isSaving = false,
  mode = "save",
  initialName = "",
  onClose,
  onSave,
}: SaveFilterViewDialogProps) => {
  const inputId = useId();
  const [name, setName] = useState("");
  const copy = dialogCopy[mode];

  useEffect(() => {
    if (isOpen) {
      setName(mode === "rename" ? initialName : "");
    } else {
      setName("");
    }
  }, [initialName, isOpen, mode]);

  const isSubmitDisabled = useMemo(() => {
    if (isSaving || name.trim().length === 0) {
      return true;
    }

    if (mode === "rename") {
      return (
        normalizeFilterViewName(name) === normalizeFilterViewName(initialName)
      );
    }

    return false;
  }, [initialName, isSaving, mode, name]);

  const handleSave = () => {
    if (onSave(name)) {
      onClose();
    }
  };

  return (
    <AppDialog
      open={isOpen}
      onClose={onClose}
      testId="fmdSaveFilterViewDialog"
      ariaLabelledBy={`${inputId}-title`}
      ariaDescribedBy={`${inputId}-description`}
      panelClassName={styles.dialog}
    >
      <Dialog.Title id={`${inputId}-title`} className={styles.title}>
        {copy.title}
      </Dialog.Title>
      <Dialog.Description
        id={`${inputId}-description`}
        className={styles.description}
      >
        {copy.description}
      </Dialog.Description>
      <label className={styles.label} htmlFor={`${inputId}-name`}>
        View name
      </label>
      <input
        id={`${inputId}-name`}
        className={styles.input}
        type="text"
        value={name}
        maxLength={MAX_FILTER_VIEW_NAME_LENGTH}
        placeholder="Sunday ambient"
        autoComplete="off"
        disabled={isSaving}
        onChange={(event) => {
          setName(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSave();
          }
        }}
      />
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          onPress={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onPress={handleSave}
          disabled={isSubmitDisabled}
          isLoading={isSaving}
          loadingText={copy.loadingText}
        >
          {copy.submitLabel}
        </Button>
      </div>
    </AppDialog>
  );
};
