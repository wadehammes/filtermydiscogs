"use client";

import { useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import Button from "src/components/Button/Button.component";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAuth } from "src/context/auth.context";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import { useCrateCollectionSync } from "src/hooks/useCrateCollectionSync.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import styles from "./SettingsClient.module.css";

const CLEAR_DATA_MESSAGE =
  "This will log you out, clear all authentication tokens, delete all your stored crates, and remove all preferences and cached data. You will need to authorize the app again to continue using Filter My Discogs.";

const COMPLETE_LOGOUT_MESSAGE =
  "This signs you out and revokes stored OAuth tokens on this browser. Your crates and local preferences stay saved—you can sign in again with Discogs when you are ready.";

export default function SettingsClient() {
  const { logout, state: authState } = useAuth();
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { clearAllUserData, isClearing } = useClearAllUserData();
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showCompleteLogoutDialog, setShowCompleteLogoutDialog] =
    useState(false);
  const {
    closeSyncDialog,
    confirmSync,
    isCollectionLoading,
    isSyncDisabled,
    isSyncing,
    openSyncDialog,
    showSyncDialog,
  } = useCrateCollectionSync();

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  const handleCompleteLogout = async () => {
    await logout({ preserveTokens: false });
    trackEvent("logout", {
      action: "userLoggedOutComplete",
      category: "auth",
      label: "Complete Logout",
      value: authState.username || "unknown",
    });
    setShowCompleteLogoutDialog(false);
  };

  return (
    <>
      <StickyHeaderBar
        allReleasesLoaded={true}
        currentPage="settings"
        hideFilters={true}
      />

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>
            Manage your account preferences and stored app data.
          </p>
        </div>

        <div className={styles.sections}>
          <section
            className={styles.section}
            aria-labelledby="settings-account"
          >
            <h2 id="settings-account" className={styles.sectionTitle}>
              Account
            </h2>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Discogs username</span>
              <p className={styles.fieldValue}>{authState.username}</p>
            </div>
            <p className={styles.sectionDescription}>
              Sign out and revoke stored OAuth tokens on this browser. Your
              crates and preferences stay saved.
            </p>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="md"
                onPress={() => setShowCompleteLogoutDialog(true)}
                disabled={authState.isLoggingOut}
              >
                {authState.isLoggingOut ? "Logging out..." : "Complete logout"}
              </Button>
            </div>
          </section>

          <section
            className={styles.section}
            aria-labelledby="settings-appearance"
          >
            <h2 id="settings-appearance" className={styles.sectionTitle}>
              Appearance
            </h2>
            <p className={styles.sectionDescription}>
              Choose light or dark mode for the app interface.
            </p>
            <div className={styles.field}>
              <span className={styles.fieldLabel} id="settings-theme-label">
                Theme
              </span>
              <ThemeSwitcher
                variant="dropdown"
                className={styles.themeSelect}
              />
            </div>
          </section>

          <section
            className={styles.section}
            aria-labelledby="settings-collection"
          >
            <h2 id="settings-collection" className={styles.sectionTitle}>
              Collection
            </h2>
            <p className={styles.sectionDescription}>
              Remove crate entries for releases that are no longer in your
              Discogs collection.
            </p>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="md"
                onPress={openSyncDialog}
                disabled={isSyncDisabled}
              >
                {isSyncing
                  ? "Syncing..."
                  : isCollectionLoading
                    ? "Loading collection..."
                    : "Sync collection"}
              </Button>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="settings-data">
            <h2 id="settings-data" className={styles.sectionTitle}>
              Stored data
            </h2>
            <p className={styles.sectionDescription}>
              Delete your crates, clear local preferences, and sign out. You
              will need to authorize the app again to continue using Filter My
              Discogs.
            </p>
            <div className={styles.actions}>
              <Button
                variant="danger"
                size="md"
                onPress={() => setShowClearDataDialog(true)}
                disabled={isClearing}
              >
                {isClearing ? "Clearing..." : "Clear all stored data"}
              </Button>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCompleteLogoutDialog}
        title="Complete logout"
        message={COMPLETE_LOGOUT_MESSAGE}
        confirmLabel={authState.isLoggingOut ? "Logging out..." : "Log out"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          void handleCompleteLogout().catch(() => {
            alert("Logout failed. Please try again.");
          });
        }}
        onCancel={() => setShowCompleteLogoutDialog(false)}
        isConfirming={authState.isLoggingOut}
      />

      <ConfirmDialog
        isOpen={showSyncDialog}
        title="Sync Collection"
        message="This will sync your crates with your Discogs collection and remove any releases from your crates that are no longer in your collection. This action cannot be undone. Continue?"
        confirmLabel={isSyncing ? "Syncing..." : "Sync"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmSync}
        onCancel={closeSyncDialog}
        isConfirming={isSyncing}
      />

      <ConfirmDialog
        isOpen={showClearDataDialog}
        title="Clear all stored data"
        message={CLEAR_DATA_MESSAGE}
        confirmLabel={isClearing ? "Clearing..." : "Clear data"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          void clearAllUserData()
            .then(() => setShowClearDataDialog(false))
            .catch(() => {
              alert("Failed to clear all data. Please try again.");
            });
        }}
        onCancel={() => setShowClearDataDialog(false)}
        isConfirming={isClearing}
      />
    </>
  );
}
