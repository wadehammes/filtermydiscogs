"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { FormDialog } from "src/components/FormDialog/FormDialog.component";
import {
  type CreatePlaylistFormValues,
  createPlaylistBodySchema,
} from "src/lib/validation/playlist.schemas";
import modalFormFieldStyles from "src/styles/modules/modal-form-field.module.css";
import modalInputStyles from "src/styles/modules/modal-input.module.css";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./CreatePlaylistDialog.module.css";

const PLAYLIST_NAME_MAX_LENGTH = 120;

export interface CreatePlaylistDialogProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  initialName?: string;
  loadingText?: string;
  onClose: () => void;
  onCreate: (values: CreatePlaylistFormValues) => void | Promise<void>;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export const CreatePlaylistDialog = ({
  isOpen,
  isSubmitting = false,
  initialName = "",
  loadingText = "Creating...",
  onClose,
  onCreate,
  title = "New playlist",
  description = "Name your playlist.",
  submitLabel = "Create playlist",
}: CreatePlaylistDialogProps) => {
  const nameInputId = useId();

  const { register, handleSubmit, reset, watch } =
    useForm<CreatePlaylistFormValues>({
      resolver: zodResolver(createPlaylistBodySchema),
      defaultValues: { name: "" },
    });

  const nameValue = watch("name");
  const trimmedName = nameValue.trim();
  const isSubmitDisabled = !trimmedName || isSubmitting;

  useEffect(() => {
    if (isOpen) {
      reset({ name: initialName });
    }
  }, [initialName, isOpen, reset]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleCreate = handleSubmit(async (values) => {
    await onCreate({ name: values.name });
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={handleClose}
      testId="fmdCreatePlaylistDialog"
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onPress={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="fmdCreatePlaylistForm"
            variant="primary"
            size="md"
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
            loadingText={loadingText}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id="fmdCreatePlaylistForm"
        className={styles.form}
        onSubmit={handleCreate}
      >
        <FormDialog.Field label="Playlist name" htmlFor={nameInputId}>
          <input
            id={nameInputId}
            type="text"
            maxLength={PLAYLIST_NAME_MAX_LENGTH}
            className={validatedFieldClass(
              modalFormFieldStyles.input,
              modalInputStyles.field,
            )}
            placeholder="Weekend spins"
            autoComplete="off"
            disabled={isSubmitting}
            {...register("name")}
            data-1p-ignore
          />
        </FormDialog.Field>
      </form>
    </FormDialog>
  );
};
