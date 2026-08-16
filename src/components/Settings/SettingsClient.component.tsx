"use client";

import classNames from "classnames";
import { useSetAtom, useStore } from "jotai";
import { useState } from "react";
import { toast } from "sonner";
import { trackEvent } from "src/analytics/analytics";
import { viewDispatchAtom, viewStateAtom } from "src/atoms/view.atoms";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { ViewActionTypes } from "src/context/view.context";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import { useCrateCollectionSync } from "src/hooks/useCrateCollectionSync.hook";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useCurrentView } from "src/hooks/useViewAtoms.hook";
import type { StoredViewState } from "src/types/userPreferences.types";
import { setFilterPersistenceEnabled } from "src/utils/filterPersistence";
import { clearPersistedFilters } from "src/utils/filtersStorage";
import styles from "./SettingsClient.module.css";
import {
  SettingsAccountPanel,
  SettingsAppearancePanel,
  SettingsCollectionPanel,
  SettingsDataPanel,
  SettingsFiltersPanel,
} from "./SettingsSectionPanels.component";
import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "./settingsSections.constants";

const CLEAR_DATA_MESSAGE =
  "This will log you out, clear all authentication tokens, delete all your stored crates, remove product analytics events linked to your account, and remove all saved preferences and cached data, including your analytics cookie choice. You will need to authorize the app again to continue using Filter My Discogs.";

const COMPLETE_LOGOUT_MESSAGE =
  "This signs you out and revokes stored OAuth tokens on this browser. Your crates and local preferences stay saved—you can sign in again with Discogs when you are ready.";

const PREFERENCES_SAVED_MESSAGE = "Preferences saved";
const PREFERENCES_SAVE_ERROR_MESSAGE = "Failed to save preferences";

const showPreferencesSavedToast = () => {
  toast.success(PREFERENCES_SAVED_MESSAGE);
};

const showPreferencesSaveErrorToast = () => {
  toast.error(PREFERENCES_SAVE_ERROR_MESSAGE);
};

export default function SettingsClient() {
  const { logout, state: authState } = useAuth();
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { clearAllUserData, isClearing } = useClearAllUserData();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    DEFAULT_SETTINGS_SECTION,
  );
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
  const { data: preferences, isPending: isPreferencesLoading } =
    useUserPreferencesQuery({
      userId: authState.userId,
      enabled: true,
    });
  const { persistPreferences, isPending: isPreferencesSaving } =
    usePersistUserPreferences();
  const dispatchView = useSetAtom(viewDispatchAtom);
  const store = useStore();
  const currentView = useCurrentView();

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  const activeSectionMeta = SETTINGS_SECTIONS.find(
    (section) => section.id === activeSection,
  );

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

  const handlePersistFiltersChange = (enabled: boolean) => {
    persistPreferences(
      { persistFilters: enabled },
      {
        onSuccess: (response) => {
          setFilterPersistenceEnabled(response.preferences.persistFilters);
          if (!response.preferences.persistFilters) {
            clearPersistedFilters();
          }
          showPreferencesSavedToast();
        },
        onError: () => {
          showPreferencesSaveErrorToast();
        },
      },
    );
  };

  const handleViewChange = (view: "card" | "list") => {
    dispatchView({
      type: ViewActionTypes.SetView,
      payload: view,
    });
    const { currentView, previousView } = store.get(viewStateAtom);
    const persistedView: StoredViewState = { currentView, previousView };
    persistPreferences(
      { view: persistedView },
      {
        onSuccess: () => {
          showPreferencesSavedToast();
        },
        onError: () => {
          showPreferencesSaveErrorToast();
        },
      },
    );
  };

  const settingsViewValue = currentView === "list" ? "list" : "card";

  const renderActivePanel = () => {
    switch (activeSection) {
      case "account":
        return (
          <SettingsAccountPanel
            authState={authState}
            onCompleteLogout={() => setShowCompleteLogoutDialog(true)}
          />
        );
      case "appearance":
        return (
          <SettingsAppearancePanel
            settingsViewValue={settingsViewValue}
            isPreferencesLoading={isPreferencesLoading}
            isPreferencesSaving={isPreferencesSaving}
            onViewChange={handleViewChange}
            onThemePersisted={showPreferencesSavedToast}
            onThemePersistError={showPreferencesSaveErrorToast}
          />
        );
      case "filters":
        return (
          <SettingsFiltersPanel
            persistFilters={preferences?.persistFilters ?? true}
            isPreferencesLoading={isPreferencesLoading}
            isPreferencesSaving={isPreferencesSaving}
            onPersistFiltersChange={handlePersistFiltersChange}
          />
        );
      case "collection":
        return (
          <SettingsCollectionPanel
            isSyncDisabled={isSyncDisabled}
            isSyncing={isSyncing}
            isCollectionLoading={isCollectionLoading}
            onSyncClick={openSyncDialog}
          />
        );
      case "data":
        return (
          <SettingsDataPanel
            isClearing={isClearing}
            onClearData={() => setShowClearDataDialog(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.pageShell}>
        <StickyHeaderBar
          allReleasesLoaded={true}
          currentPage="settings"
          hideFilters={true}
        />

        <div className={styles.page}>
          <div className={styles.container}>
            <header className={styles.pageHeader}>
              <h1 className={styles.title}>Settings</h1>
              <p className={styles.subtitle}>
                Manage your account preferences and stored app data.
              </p>
            </header>

            <div className={styles.layout}>
              <nav className={styles.sidebar} aria-label="Settings sections">
                <ul className={styles.sidebarList}>
                  {SETTINGS_SECTIONS.map((section) => {
                    const isActive = section.id === activeSection;

                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          className={classNames(styles.sidebarButton, {
                            [styles.sidebarButtonActive]: isActive,
                          })}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setActiveSection(section.id)}
                        >
                          <span className={styles.sidebarButtonLabel}>
                            {section.label}
                          </span>
                          <span className={styles.sidebarButtonDescription}>
                            {section.description}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <section
                className={styles.panel}
                aria-labelledby="settings-panel-title"
              >
                <header className={styles.panelHeader}>
                  <h2 id="settings-panel-title" className={styles.panelTitle}>
                    {activeSectionMeta?.label}
                  </h2>
                  {activeSectionMeta ? (
                    <p className={styles.panelLead}>
                      {activeSectionMeta.description}
                    </p>
                  ) : null}
                </header>
                <div className={styles.panelBody}>{renderActivePanel()}</div>
              </section>
            </div>
          </div>
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
            toast.error("Logout failed. Please try again.");
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
              toast.error("Failed to clear all data. Please try again.");
            });
        }}
        onCancel={() => setShowClearDataDialog(false)}
        isConfirming={isClearing}
      />
    </>
  );
}
