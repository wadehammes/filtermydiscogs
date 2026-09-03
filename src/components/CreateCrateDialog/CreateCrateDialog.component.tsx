"use client";

import { Dialog } from "@base-ui/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { AppDialog } from "src/components/AppDialog/AppDialog.component";
import Button from "src/components/Button/Button.component";
import { CRATE_NAME_MAX_LENGTH } from "src/constants/crate";
import {
  type CreateCrateFormValues,
  createCrateFormSchema,
} from "src/lib/validation/crate.schemas";
import modalInputStyles from "src/styles/modules/modal-input.module.css";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./CreateCrateDialog.module.css";

export interface CreateCrateDialogProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onCreate: (values: CreateCrateFormValues) => void | Promise<void>;
  title?: string;
  description?: string;
  showSetAsDefault?: boolean;
  submitLabel?: string;
}

export const CreateCrateDialog = ({
  isOpen,
  isSubmitting = false,
  onClose,
  onCreate,
  title = "Add to new crate",
  description = "Create a crate and add this release to it.",
  showSetAsDefault = true,
  submitLabel = "Create crate",
}: CreateCrateDialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const nameInputId = useId();

  const { register, handleSubmit, reset, watch } =
    useForm<CreateCrateFormValues>({
      resolver: zodResolver(createCrateFormSchema),
      defaultValues: {
        name: "",
        setAsDefault: false,
      },
    });

  const nameValue = watch("name");
  const trimmedName = nameValue.trim();
  const isSubmitDisabled = !trimmedName || isSubmitting;

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        setAsDefault: false,
      });
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleCreate = handleSubmit(async (values) => {
    await onCreate({
      name: values.name,
      setAsDefault: showSetAsDefault ? values.setAsDefault : false,
    });
  });

  return (
    <AppDialog
      open={isOpen}
      onClose={handleClose}
      testId="fmdCreateCrateDialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      panelClassName={styles.dialog}
    >
      <Dialog.Title id={titleId} className={styles.title}>
        {title}
      </Dialog.Title>
      {description ? (
        <Dialog.Description id={descriptionId} className={styles.description}>
          {description}
        </Dialog.Description>
      ) : null}
      <form className={styles.form} onSubmit={handleCreate}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={nameInputId}>
            Crate name
          </label>
          <input
            id={nameInputId}
            type="text"
            className={validatedFieldClass(
              styles.input,
              modalInputStyles.field,
            )}
            maxLength={CRATE_NAME_MAX_LENGTH}
            placeholder="Weekend favorites"
            autoComplete="off"
            disabled={isSubmitting}
            {...register("name")}
          />
        </div>
        {showSetAsDefault ? (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              disabled={isSubmitting}
              {...register("setAsDefault")}
            />
            <span>Set as default crate</span>
          </label>
        ) : null}
        <div className={styles.actions}>
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
            variant="primary"
            size="md"
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
            loadingText="Creating..."
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
};
