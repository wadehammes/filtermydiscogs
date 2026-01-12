import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import Button from "src/components/Button/Button.component";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAuth } from "src/context/auth.context";
import { useSyncCratesMutation } from "src/hooks/queries/useCrateMutations";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import Chevron from "src/styles/icons/chevron-right-solid.svg";
import { prepareCollectionForSync } from "src/utils/syncCollection.helper";
import styles from "./UserActions.module.css";

interface UserActionsProps {
  variant?: "mobile" | "desktop";
  showMosaic?: boolean;
  showUsername?: boolean;
}

export const UserActions = ({
  variant = "desktop",
  showMosaic = true,
  showUsername = true,
}: UserActionsProps) => {
  const { logout, state: authState } = useAuth();
  const { username, isAuthenticated } = authState;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const syncMutation = useSyncCratesMutation();
  const {
    data: collectionData,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscogsCollectionQuery(username || "", isAuthenticated);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    trackEvent("logout", {
      action: "userLoggedOut",
      category: "auth",
      label: "User Logged Out",
      value: username || "unknown",
    });
  };

  const handleMosaicClick = () => {
    trackEvent("mosaicNavigation", {
      action: "mosaicNavigation",
      category: "navigation",
      label: "Navigate to Mosaic",
      value: "header",
    });
  };

  const handleSyncClick = () => {
    setIsDropdownOpen(false);
    setShowSyncDialog(true);
  };

  const handleSyncConfirm = () => {
    const syncResult = prepareCollectionForSync(
      collectionData,
      hasNextPage,
      isFetchingNextPage,
    );

    if (!syncResult.isValid) {
      alert(syncResult.error);
      setShowSyncDialog(false);
      return;
    }

    if (!syncResult.instanceIds) {
      alert("No instance IDs found.");
      setShowSyncDialog(false);
      return;
    }

    syncMutation.mutate(
      { collectionInstanceIds: syncResult.instanceIds },
      {
        onSuccess: (data) => {
          setShowSyncDialog(false);
          trackEvent("crateSync", {
            action: "crateSyncManual",
            category: "crate",
            label: "Manual Crate Sync",
            value: data.removedCount.toString(),
          });
          if (data.removedCount > 0) {
            alert(
              `Sync complete: Removed ${data.removedCount} release${data.removedCount !== 1 ? "s" : ""} from your crates.`,
            );
          } else {
            alert(
              "Sync complete: All releases in your crates are still in your collection.",
            );
          }
        },
        onError: (error) => {
          alert(
            `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        },
      },
    );
  };

  const buttonSize = "sm";
  const containerClass =
    variant === "mobile" ? styles.mobileActions : styles.userSection;

  const isCollectionLoading = hasNextPage || isFetchingNextPage;
  const isSyncDisabled = syncMutation.isPending || isCollectionLoading;

  return (
    <div className={containerClass}>
      {showMosaic && (
        <Link
          href="/mosaic"
          className={styles.mosaicLink}
          onClick={handleMosaicClick}
          aria-label="View mosaic"
        >
          <span>🖼️</span>
          <span>Mosaic</span>
        </Link>
      )}

      {showUsername && username && (
        <div className={styles.userDropdown} ref={containerRef}>
          <button
            type="button"
            className={styles.usernameTrigger}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className={styles.username}>{username}</span>
            <Chevron
              className={`${styles.chevron} ${
                isDropdownOpen ? styles.chevronOpen : ""
              }`}
            />
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownItem}>
                <ThemeSwitcher variant="desktop" />
              </div>
              <div className={styles.dropdownItem}>
                <Button
                  variant="secondary"
                  size={buttonSize}
                  onPress={handleSyncClick}
                  disabled={isSyncDisabled}
                >
                  {syncMutation.isPending
                    ? "Syncing..."
                    : isCollectionLoading
                      ? "Loading..."
                      : "Sync Collection"}
                </Button>
              </div>
              <div className={styles.dropdownItem}>
                <Button
                  variant="danger"
                  size={buttonSize}
                  onPress={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showSyncDialog}
        title="Sync Collection"
        message="This will sync your crates with your Discogs collection and remove any releases from your crates that are no longer in your collection. This action cannot be undone. Continue?"
        confirmLabel={syncMutation.isPending ? "Syncing..." : "Sync"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleSyncConfirm}
        onCancel={() => setShowSyncDialog(false)}
        isConfirming={syncMutation.isPending}
      />
    </div>
  );
};
