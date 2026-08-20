import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { EditCrateDialog } from "src/components/EditCrateDialog/EditCrateDialog.component";

export const CrateDrawerDialogs = () => {
  const {
    crateName,
    handleClearConfirm,
    handleClearPackedConfirm,
    handleDeleteCrate,
    handleMakeDefaultConfirm,
    isDeletingCrate,
    isUpdatingCrate,
    packedCount,
    selectedReleases,
    setShowClearDialog,
    setShowClearPackedDialog,
    setShowDeleteDialog,
    setShowMakeDefaultDialog,
    showClearDialog,
    showClearPackedDialog,
    showDeleteDialog,
    showMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;

  return (
    <>
      <EditCrateDialog />

      <ConfirmDialog
        isOpen={showClearDialog}
        title="Empty Crate"
        message={`Are you sure you want to remove all ${releaseCount} release${releaseCount !== 1 ? "s" : ""} from "${crateName}"? This action cannot be undone.`}
        confirmLabel="Empty Crate"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearDialog(false)}
      />

      <ConfirmDialog
        isOpen={showClearPackedDialog}
        title="Clear packed marks"
        message={`Clear packed marks for ${packedCount} release${packedCount !== 1 ? "s" : ""} in "${crateName}"? Releases stay in the crate.`}
        confirmLabel="Clear marks"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleClearPackedConfirm}
        onCancel={() => setShowClearPackedDialog(false)}
      />

      <ConfirmDialog
        isOpen={showMakeDefaultDialog}
        title="Make Default Crate"
        message={`Are you sure you want to make "${crateName}" your default crate? This will replace your current default crate.`}
        confirmLabel={isUpdatingCrate ? "Making Default..." : "Make Default"}
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleMakeDefaultConfirm}
        onCancel={() => setShowMakeDefaultDialog(false)}
        isConfirming={isUpdatingCrate}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete crate"
        message={`Delete "${crateName}" and all ${releaseCount} release${releaseCount !== 1 ? "s" : ""} in it? This permanently removes the crate and cannot be undone.`}
        confirmLabel={isDeletingCrate ? "Deleting..." : "Delete crate"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void handleDeleteCrate()}
        onCancel={() => setShowDeleteDialog(false)}
        isConfirming={isDeletingCrate}
      />
    </>
  );
};
