import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { EditCrateDialog } from "src/components/EditCrateDialog/EditCrateDialog.component";
import { useCrateDrawerContext } from "./CrateDrawer.context";

export const CrateDrawerDialogs = () => {
  const {
    canDelete,
    crateName,
    handleClearConfirm,
    handleDeleteCrate,
    handleMakeDefaultConfirm,
    handleSaveCrateName,
    isDefaultCrate,
    isDeletingCrate,
    isUpdatingCrate,
    selectedReleases,
    setShowClearDialog,
    setShowEditCrateDialog,
    setShowMakeDefaultDialog,
    showClearDialog,
    showEditCrateDialog,
    showMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;

  return (
    <>
      <EditCrateDialog
        isOpen={showEditCrateDialog}
        crateName={crateName}
        isDefaultCrate={isDefaultCrate}
        canDelete={canDelete}
        isUpdatingCrate={isUpdatingCrate}
        isDeletingCrate={isDeletingCrate}
        onClose={() => setShowEditCrateDialog(false)}
        onSaveName={handleSaveCrateName}
        onDelete={handleDeleteCrate}
      />

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
    </>
  );
};
