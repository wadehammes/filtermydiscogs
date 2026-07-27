import classNames from "classnames";
import { useCallback, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import drawerStyles from "src/components/CrateDrawer/CrateDrawer.module.css";
import modalInputStyles from "src/styles/modal-input.module.css";
import styles from "./EditCrateDialog.module.css";

type EditCrateFormValues = {
  name: string;
  deleteConfirm: string;
};

export const EditCrateDialog = () => {
  const {
    canDelete,
    crateName,
    handleDeleteCrate,
    handlePackedEnabledToggle,
    handleSaveCrateName,
    isDefaultCrate,
    isDeletingCrate,
    isUpdatingCrate,
    packedEnabled,
    setShowEditCrateDialog,
    showEditCrateDialog,
  } = useCrateDrawerContext();

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
    if (showEditCrateDialog) {
      reset({
        name: crateName,
        deleteConfirm: "",
      });
    }
  }, [crateName, reset, showEditCrateDialog]);

  const onClose = useCallback(() => {
    setShowEditCrateDialog(false);
  }, [setShowEditCrateDialog]);

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

    await handleSaveCrateName(trimmedName);
  });

  const trimmedNameValue = nameValue.trim();
  const isSaveDisabled =
    !trimmedNameValue || trimmedNameValue === crateName.trim() || isBusy;
  const isDeleteConfirmMatch =
    deleteConfirmValue.trim() === crateName.trim() &&
    crateName.trim().length > 0;

  if (!showEditCrateDialog) {
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
            className={classNames(styles.input, modalInputStyles.field)}
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

        <section
          className={styles.section}
          aria-labelledby={`${titleId}-packed-setting`}
        >
          <h3 id={`${titleId}-packed-setting`} className={styles.sectionTitle}>
            Packed checklist
          </h3>
          <p className={styles.settingDescription}>
            When you&apos;re digging through crates, mark each release as packed
            once you&apos;ve found it. Turn this off to hide the checklist in
            this crate—your packed status is still saved.
          </p>
          <label className={drawerStyles.checkboxLabel}>
            <input
              type="checkbox"
              className={drawerStyles.sharingCheckbox}
              checked={packedEnabled}
              onChange={() => void handlePackedEnabledToggle()}
              disabled={isBusy}
            />
            <span>Enable packed checklist for this crate</span>
          </label>
        </section>

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
              className={classNames(styles.input, modalInputStyles.field)}
              autoComplete="off"
              disabled={isBusy}
              {...register("deleteConfirm")}
            />
            <div className={styles.sectionActions}>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onPress={handleDeleteCrate}
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
