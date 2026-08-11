import { Dialog } from "@base-ui/react/dialog";
import classNames from "classnames";
import { useCallback, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import footerStyles from "src/components/CrateDrawer/CrateDrawerFooter.module.css";
import { AppDialog } from "src/components/shared/AppDialog/AppDialog.component";
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

  const handleClose = useCallback(() => {
    if (!isBusy) {
      onClose();
    }
  }, [isBusy, onClose]);

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

  return (
    <AppDialog
      open={showEditCrateDialog}
      onClose={handleClose}
      testId="fmdEditCrateDialog"
      ariaLabelledBy={titleId}
      backdropVariant="modal"
      panelClassName={styles.dialog}
    >
      <div className={styles.titleRow}>
        <Dialog.Title id={titleId} className={styles.title}>
          Edit Crate
        </Dialog.Title>
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
          Gig packing checklist
        </h3>
        <p className={styles.settingDescription}>
          Mark each album as packed once it&apos;s in the bag for your gig. Turn
          this off to hide the checklist in this crate—your packed marks are
          still saved.
        </p>
        <label className={footerStyles.checkboxLabel}>
          <input
            type="checkbox"
            className={footerStyles.sharingCheckbox}
            checked={packedEnabled}
            onChange={() => void handlePackedEnabledToggle()}
            disabled={isBusy}
          />
          <span>Show gig packing checklist</span>
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
          onPress={handleClose}
          disabled={isBusy}
        >
          Close
        </Button>
      </div>
    </AppDialog>
  );
};
