import Button from "src/components/Button/Button.component";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";

export const CrateDrawerFooter = () => {
  const {
    activeCrateId,
    copySuccess,
    handleCopyLink,
    handlePrivacyToggle,
    isDefaultCrate,
    isDeletingCrate,
    isPublic,
    isUpdatingCrate,
    selectedReleases,
    setShowClearDialog,
    setShowEditCrateDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  return (
    <div className={styles.footer}>
      <div className={styles.footerActions}>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => setShowEditCrateDialog(true)}
          disabled={!activeCrateId || isBusy}
        >
          Edit Crate
        </Button>
        <Button
          variant="danger"
          size="sm"
          onPress={() => setShowClearDialog(true)}
          disabled={releaseCount === 0}
        >
          Clear Crate
        </Button>
        {!isDefaultCrate ? (
          <Button
            variant="outlinePrimary"
            size="sm"
            onPress={() => setShowMakeDefaultDialog(true)}
            disabled={isBusy}
          >
            {isUpdatingCrate ? "Making Default..." : "Make Default"}
          </Button>
        ) : null}
      </div>
      <div className={styles.sharingSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => void handlePrivacyToggle()}
            disabled={isBusy || !activeCrateId}
            className={styles.checkbox}
          />
          <span>Make shareable</span>
        </label>
        {isPublic && activeCrateId ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => void handleCopyLink()}
            disabled={isBusy}
          >
            {copySuccess ? "Copied!" : "Copy Link"}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
