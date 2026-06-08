import { useCallback, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import styles from "./EditCrateDialog.module.css";

type EditCrateFormValues = {
  name: string;
  deleteConfirm: string;
};

type EditCrateDialogProps = {
  isOpen: boolean;
  crateName: string;
  isDefaultCrate: boolean;
  canDelete: boolean;
  isUpdatingCrate: boolean;
  isDeletingCrate: boolean;
  onClose: () => void;
  onSaveName: (name: string) => Promise<void>;
  onDelete: () => void;
};

export const EditCrateDialog = ({
  isOpen,
  crateName,
  isDefaultCrate,
  canDelete,
  isUpdatingCrate,
  isDeletingCrate,
  onClose,
  onSaveName,
  onDelete,
}: EditCrateDialogProps) => {
  const titleId = useId();
  const isBusy = isUpdatingCrate || isDeletingCrate;

  const { register, handleSubmit, reset, watch } = useForm<EditCrateFormValues>(
    {
      defaultValues: {
        name: crateName,
        deleteConfirm: "",
      },
    },
  );

  const nameValue = watch("name");
  const deleteConfirmValue = watch("deleteConfirm");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: crateName,
        deleteConfirm: "",
      });
    }
  }, [crateName, isOpen, reset]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isBusy) {
        onClose();
      }
    },
    [isBusy, onClose],
  );

  const handleSaveName = handleSubmit(async ({ name }) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    if (trimmedName === crateName.trim()) {
      onClose();
      return;
    }

    await onSaveName(trimmedName);
  });

  const trimmedNameValue = nameValue.trim();
  const isSaveDisabled =
    !trimmedNameValue || trimmedNameValue === crateName.trim() || isBusy;
  const isDeleteConfirmMatch =
    deleteConfirmValue.trim() === crateName.trim() &&
    crateName.trim().length > 0;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      data-testid="fmdEditCrateDialog"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !isBusy) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={styles.dialog}>
        <div className={styles.titleRow}>
          <h2 id={titleId} className={styles.title}>
            Edit Crate
          </h2>
          {isDefaultCrate ? (
            <span className={styles.defaultBadge}>Default</span>
          ) : null}
        </div>

        <form
          className={styles.section}
          aria-labelledby={titleId}
          onSubmit={handleSaveName}
        >
          <label className={styles.label} htmlFor={`${titleId}-name-input`}>
            Crate name
          </label>
          <input
            id={`${titleId}-name-input`}
            type="text"
            className={styles.input}
            disabled={isBusy}
            {...register("name")}
          />
          <div className={styles.sectionActions}>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaveDisabled}
            >
              {isUpdatingCrate ? "Saving..." : "Save name"}
            </Button>
          </div>
        </form>

        {canDelete ? (
          <section
            className={styles.dangerSection}
            aria-labelledby={`${titleId}-delete`}
          >
            <h3 id={`${titleId}-delete`} className={styles.sectionTitle}>
              Delete crate
            </h3>
            <p className={styles.dangerDescription}>
              This permanently removes the crate and all releases in it. Type{" "}
              <span className={styles.crateNameHighlight}>{crateName}</span> to
              confirm.
            </p>
            <label className={styles.label} htmlFor={`${titleId}-delete-input`}>
              Confirm crate name
            </label>
            <input
              id={`${titleId}-delete-input`}
              type="text"
              className={styles.input}
              autoComplete="off"
              disabled={isBusy}
              {...register("deleteConfirm")}
            />
            <div className={styles.sectionActions}>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onPress={onDelete}
                disabled={!isDeleteConfirmMatch || isBusy}
              >
                {isDeletingCrate ? "Deleting..." : "Delete crate"}
              </Button>
            </div>
          </section>
        ) : null}

        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onPress={onClose}
            disabled={isBusy}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
