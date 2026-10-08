"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { FormDialog } from "src/components/FormDialog/FormDialog.component";
import {
  CLEAR_ALL_DATA_CONFIRM_PHRASE,
  CLEAR_ALL_DATA_DIALOG_MESSAGE,
} from "src/constants/clearData.constants";
import {
  type ClearAllDataConfirmFormValues,
  clearAllDataConfirmFormSchema,
} from "src/lib/validation/clearData.schemas";
import modalInputStyles from "src/styles/modules/modal-input.module.css";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./ClearAllDataConfirmDialog.module.css";

const FORM_ID = "fmdClearAllDataConfirmForm";

type ClearAllDataConfirmDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isConfirming?: boolean;
};

export const ClearAllDataConfirmDialog = ({
  isOpen,
  onConfirm,
  onClose,
  isConfirming = false,
}: ClearAllDataConfirmDialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid, errors },
  } = useForm<ClearAllDataConfirmFormValues>({
    resolver: zodResolver(clearAllDataConfirmFormSchema),
    defaultValues: { phrase: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      reset({ phrase: "" });
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    if (!isConfirming) {
      onClose();
    }
  };

  const handleConfirm = handleSubmit(() => {
    onConfirm();
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={handleClose}
      testId="fmdClearAllDataConfirmDialog"
      title="Clear all stored data"
      description={CLEAR_ALL_DATA_DIALOG_MESSAGE}
      titleId={titleId}
      descriptionId={descriptionId}
      panelWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onPress={handleClose}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="danger"
            size="md"
            disabled={!isValid || isConfirming}
            isLoading={isConfirming}
            loadingText="Clearing..."
          >
            Clear all data
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className={styles.form}
        onSubmit={handleConfirm}
        noValidate
      >
        <FormDialog.Field
          label={`Type ${CLEAR_ALL_DATA_CONFIRM_PHRASE} to confirm`}
          htmlFor={inputId}
        >
          <input
            id={inputId}
            type="text"
            className={validatedFieldClass(
              styles.input,
              modalInputStyles.field,
              errors.phrase?.message,
            )}
            disabled={isConfirming}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={errors.phrase ? true : undefined}
            data-1p-ignore
            {...register("phrase", {
              setValueAs: (value: string) => value.toUpperCase(),
            })}
          />
        </FormDialog.Field>
      </form>
    </FormDialog>
  );
};
