import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import Button from "src/components/Button/Button.component";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { CrateSelector } from "src/components/CrateSelector/CrateSelector.component";
import { EditCrateDialog } from "src/components/EditCrateDialog/EditCrateDialog.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useCurrentView } from "src/hooks/useViewAtoms.hook";
import XIcon from "src/styles/icons/x.svg";
import { copyToClipboard } from "src/utils/copyToClipboard";
import { getReleaseImageUrl, getSiteUrl } from "src/utils/helpers";
import styles from "./CrateDrawer.module.css";

interface CrateDrawerProps {
  isOpen: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

const CrateDrawerComponent = ({ isOpen, onReleaseClick }: CrateDrawerProps) => {
  const {
    selectedReleases,
    removeFromCrate,
    clearCrate,
    deleteCrate,
    updateCrate,
    crates,
    activeCrateId,
    toggleDrawer,
    isUpdatingCrate,
    isDeletingCrate,
    isLoadingCrate,
  } = useCrate();
  const currentView = useCurrentView();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showMakeDefaultDialog, setShowMakeDefaultDialog] = useState(false);
  const [showEditCrateDialog, setShowEditCrateDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const activeCrate = crates.find((c) => c.id === activeCrateId);
  const crateName = activeCrate?.name || "My Crate";
  const isDefaultCrate = activeCrate?.is_default === true;
  const isPublic = activeCrate?.private === false;
  const canDelete = crates.length > 1 && !isDefaultCrate;

  const handleClearConfirm = useCallback(() => {
    clearCrate();
    setShowClearDialog(false);
  }, [clearCrate]);

  const handleDeleteCrate = useCallback(() => {
    if (activeCrateId) {
      deleteCrate(activeCrateId);
      setShowEditCrateDialog(false);
    }
  }, [activeCrateId, deleteCrate]);

  const handleMakeDefaultConfirm = useCallback(async () => {
    if (!activeCrateId) return;

    try {
      await updateCrate(activeCrateId, { is_default: true });
      setShowMakeDefaultDialog(false);
    } catch (error) {
      console.error("Failed to make crate default:", error);
      alert(
        `Failed to make crate default: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [activeCrateId, updateCrate]);

  const handlePrivacyToggle = useCallback(async () => {
    if (!activeCrate) {
      console.error("Active crate not found");
      return;
    }

    try {
      const currentPrivateValue = activeCrate.private;
      const updates = { private: !currentPrivateValue };
      await updateCrate(activeCrate.id, updates);
    } catch (error) {
      console.error("Failed to update crate privacy:", error);
      alert(
        `Failed to update crate privacy: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [activeCrate, updateCrate]);

  const handleCopyLink = useCallback(async () => {
    if (!activeCrateId) return;

    const siteUrl = getSiteUrl();
    const crateUrl = `${siteUrl}/crate/${activeCrateId}`;

    const success = await copyToClipboard(crateUrl);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      alert("Failed to copy link to clipboard");
    }
  }, [activeCrateId]);

  const handleSaveCrateName = useCallback(
    async (name: string) => {
      if (!activeCrateId) {
        return;
      }

      try {
        await updateCrate(activeCrateId, { name });
        setShowEditCrateDialog(false);
      } catch (error) {
        console.error("Error renaming crate:", error);
        alert(
          `Failed to rename crate: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [activeCrateId, updateCrate],
  );

  useEffect(() => {
    setShowEditCrateDialog(false);
  }, [activeCrateId]);

  const releasesContent = (
    <>
      {isLoadingCrate ? (
        <div className={styles.emptyState}>
          <PageLoader message="Loading crate..." />
        </div>
      ) : selectedReleases.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No releases added to your crate yet.</h3>
          <p>
            {currentView === "list"
              ? "Toggle the checkbox on any release to add it to this crate"
              : 'Click the "+ Add to Crate" button on any release to add it to this crate'}
          </p>
        </div>
      ) : (
        <div className={styles.releasesList}>
          {selectedReleases.map((release) => {
            const { basic_information } = release;
            const imageUrl = getReleaseImageUrl({
              thumb: basic_information.thumb,
              cover_image: basic_information.cover_image,
              width: 100,
              height: 100,
              preferCoverImage: true,
            });

            return (
              // biome-ignore lint/a11y/useSemanticElements: Cannot use button here due to nested button (remove button)
              <div
                key={release.instance_id}
                className={styles.listItem}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onReleaseClick) {
                    onReleaseClick(String(release.instance_id));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onReleaseClick) {
                      onReleaseClick(String(release.instance_id));
                    }
                  }
                }}
              >
                <div className={styles.itemImage}>
                  <Image
                    src={imageUrl}
                    height={100}
                    width={100}
                    quality={100}
                    alt={basic_information.title}
                    loading="lazy"
                    sizes="100px"
                  />
                </div>
                <div className={styles.itemContent}>
                  <span className={`typography-span ${styles.itemTitle || ""}`}>
                    {basic_information.title}
                  </span>
                  <span
                    className={`typography-span ${styles.itemArtist || ""}`}
                  >
                    {basic_information.artists
                      .map((artist) => artist.name)
                      .join(", ")}
                  </span>
                  <span className={`typography-span ${styles.itemLabel || ""}`}>
                    {basic_information.labels[0]?.name} &bull;{" "}
                    {basic_information.year}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromCrate(release.instance_id);
                  }}
                  aria-label={`Remove ${basic_information.title} from crate`}
                >
                  <XIcon className={styles.removeIcon} aria-hidden />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const footerContent = (
    <div className={styles.footer}>
      <div className={styles.footerActions}>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => setShowEditCrateDialog(true)}
          disabled={!activeCrateId || isUpdatingCrate || isDeletingCrate}
        >
          Edit Crate
        </Button>
        <Button
          variant="danger"
          size="sm"
          onPress={() => setShowClearDialog(true)}
          disabled={selectedReleases.length === 0}
        >
          Clear Crate
        </Button>
        {!isDefaultCrate && (
          <>
            <Button
              variant="outlinePrimary"
              size="sm"
              onPress={() => setShowMakeDefaultDialog(true)}
              disabled={isUpdatingCrate || isDeletingCrate}
            >
              {isUpdatingCrate ? "Making Default..." : "Make Default"}
            </Button>
          </>
        )}
      </div>
      <div className={styles.sharingSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={handlePrivacyToggle}
            disabled={isUpdatingCrate || isDeletingCrate || !activeCrateId}
            className={styles.checkbox}
          />
          <span>Make shareable</span>
        </label>
        {isPublic && activeCrateId && (
          <Button
            variant="secondary"
            size="sm"
            onPress={handleCopyLink}
            disabled={isUpdatingCrate || isDeletingCrate}
          >
            {copySuccess ? "Copied!" : "Copy Link"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <BottomDrawer
          isOpen={isOpen}
          onClose={toggleDrawer}
          closeButtonAriaLabel="Close crate drawer"
          headerContent={
            <CrateSelector
              {...(styles.headerCrateSelector
                ? { className: styles.headerCrateSelector }
                : {})}
            />
          }
          footer={footerContent}
        >
          <div className={styles.content}>{releasesContent}</div>
        </BottomDrawer>
      ) : (
        <div className={styles.drawer}>
          <div className={styles.header}>
            <CrateSelector
              {...(styles.headerCrateSelector
                ? { className: styles.headerCrateSelector }
                : {})}
            />
          </div>
          <div className={styles.content}>{releasesContent}</div>
          {footerContent}
        </div>
      )}

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
        title="Clear Crate"
        message={`Are you sure you want to remove all ${selectedReleases.length} release${selectedReleases.length !== 1 ? "s" : ""} from "${crateName}"? This action cannot be undone.`}
        confirmLabel="Clear"
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

export const CrateDrawer = CrateDrawerComponent;
