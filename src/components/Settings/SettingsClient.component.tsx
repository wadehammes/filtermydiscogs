"use client";

import classNames from "classnames";
import { useSetAtom, useStore } from "jotai";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  ViewActionTypes,
  viewDispatchAtom,
  viewStateAtom,
} from "src/atoms/view.atoms";
import { ClearAllDataConfirmDialog } from "src/components/ClearAllDataConfirmDialog/ClearAllDataConfirmDialog.component";
import { ConfirmDialog } from "src/components/ConfirmDialog/ConfirmDialog.component";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { ScrollRevealOnce } from "src/components/ScrollReveal/ScrollReveal.component";
import {
  SETTINGS_COMPLETE_LOGOUT_DIALOG_MESSAGE,
  SETTINGS_COMPLETE_LOGOUT_PANEL_DESCRIPTION,
  SETTINGS_CONTACT_SAVE_ERROR_MESSAGE,
  SETTINGS_CONTACT_SAVED_MESSAGE,
  SETTINGS_EMAIL_VERIFICATION_EXPIRED_MESSAGE,
  SETTINGS_EMAIL_VERIFICATION_INVALID_MESSAGE,
  SETTINGS_EMAIL_VERIFICATION_SENT_MESSAGE,
  SETTINGS_EMAIL_VERIFIED_TOAST_MESSAGE,
} from "src/constants/settingsCopy.constants";
import { useAuth } from "src/context/auth.context";
import { useUpdateUserContactMutation } from "src/hooks/mutations/useUserContactMutations";
import { useUserContactQuery } from "src/hooks/queries/useUserContactQuery";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useConfirmClearAllUserData } from "src/hooks/useConfirmClearAllUserData.hook";
import { useCrateCollectionSync } from "src/hooks/useCrateCollectionSync.hook";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useCurrentView } from "src/hooks/useViewAtoms.hook";
import {
  type CollectionSidePanelPreference,
  DEFAULT_AUTO_PLAY_ON_QUEUE_ADD,
  DEFAULT_COLLECTION_SIDE_PANEL,
  DEFAULT_EXTEND_QUEUE_WITH_SIMILAR_RELEASES,
  type StoredViewState,
} from "src/types/userPreferences.types";
import { setFilterPersistenceEnabled } from "src/utils/filterPersistence";
import { clearPersistedFilters } from "src/utils/filtersStorage";
import { toast } from "src/utils/toast";
import styles from "./SettingsClient.module.css";
import {
  SettingsAccountCompleteLogoutPanel,
  SettingsAccountPanel,
  SettingsAppearancePanel,
  SettingsCollectionPanel,
  SettingsDataPanel,
  SettingsFiltersPanel,
  SettingsPlaybackPanel,
  SettingsSupportPanel,
} from "./SettingsSectionPanels.component";
import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "./settingsSections.constants";

const isSettingsSectionId = (value: string): value is SettingsSectionId =>
  SETTINGS_SECTIONS.some((section) => section.id === value);

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
  const {
    closeClearDataDialog,
    handleConfirmClear,
    isClearDataDialogOpen,
    isClearing,
    openClearDataDialog,
  } = useConfirmClearAllUserData();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    DEFAULT_SETTINGS_SECTION,
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("section");

    if (section && isSettingsSectionId(section)) {
      setActiveSection(section);
    }

    const verification = searchParams.get("emailVerification");

    if (verification === "success") {
      toast.success(SETTINGS_EMAIL_VERIFIED_TOAST_MESSAGE);
    } else if (verification === "expired") {
      toast.error(SETTINGS_EMAIL_VERIFICATION_EXPIRED_MESSAGE);
    } else if (verification === "invalid") {
      toast.error(SETTINGS_EMAIL_VERIFICATION_INVALID_MESSAGE);
    }
  }, [searchParams]);

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
  const { data: userContact, isPending: isContactLoading } =
    useUserContactQuery({
      userId: authState.userId,
      enabled: true,
    });
  const { mutate: updateUserContact, isPending: isContactSaving } =
    useUpdateUserContactMutation(authState.userId);

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

  const persistPlaybackBooleanPreference = (
    patch:
      | { autoPlayOnQueueAdd: boolean }
      | { extendQueueWithSimilarReleases: boolean },
  ) => {
    persistPreferences(patch, {
      onSuccess: showPreferencesSavedToast,
      onError: showPreferencesSaveErrorToast,
    });
  };

  const handleAutoPlayOnQueueAddChange = (enabled: boolean) => {
    persistPlaybackBooleanPreference({ autoPlayOnQueueAdd: enabled });
  };

  const handleExtendQueueWithSimilarReleasesChange = (enabled: boolean) => {
    persistPlaybackBooleanPreference({
      extendQueueWithSimilarReleases: enabled,
    });
  };

  const handleDefaultCollectionSidePanelChange = (
    panel: CollectionSidePanelPreference,
  ) => {
    persistPreferences(
      { defaultCollectionSidePanel: panel },
      {
        onSuccess: showPreferencesSavedToast,
        onError: showPreferencesSaveErrorToast,
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
            savedEmail={userContact?.email ?? null}
            pendingEmail={userContact?.pendingEmail ?? null}
            emailVerified={userContact?.emailVerified ?? false}
            marketingEmailsOptIn={userContact?.marketingEmailsOptIn ?? false}
            isContactLoading={isContactLoading}
            isContactSaving={isContactSaving}
            onPersistEmail={(email) => {
              updateUserContact(
                { email: email === "" ? "" : email },
                {
                  onSuccess: (contact) => {
                    if (contact.pendingEmail) {
                      toast.success(SETTINGS_EMAIL_VERIFICATION_SENT_MESSAGE);
                      return;
                    }

                    toast.success(SETTINGS_CONTACT_SAVED_MESSAGE);
                  },
                  onError: () => {
                    toast.error(SETTINGS_CONTACT_SAVE_ERROR_MESSAGE);
                  },
                },
              );
            }}
            onResendEmailVerification={() => {
              updateUserContact(
                { resendEmailVerification: true },
                {
                  onSuccess: () => {
                    toast.success(SETTINGS_EMAIL_VERIFICATION_SENT_MESSAGE);
                  },
                  onError: () => {
                    toast.error(SETTINGS_CONTACT_SAVE_ERROR_MESSAGE);
                  },
                },
              );
            }}
            onMarketingEmailsOptInChange={(enabled) => {
              updateUserContact(
                { marketingEmailsOptIn: enabled },
                {
                  onSuccess: () => {
                    toast.success(SETTINGS_CONTACT_SAVED_MESSAGE);
                  },
                  onError: () => {
                    toast.error(SETTINGS_CONTACT_SAVE_ERROR_MESSAGE);
                  },
                },
              );
            }}
          />
        );
      case "appearance":
        return (
          <SettingsAppearancePanel
            settingsViewValue={settingsViewValue}
            defaultCollectionSidePanel={
              preferences?.defaultCollectionSidePanel ??
              DEFAULT_COLLECTION_SIDE_PANEL
            }
            isPreferencesLoading={isPreferencesLoading}
            isPreferencesSaving={isPreferencesSaving}
            onViewChange={handleViewChange}
            onDefaultCollectionSidePanelChange={
              handleDefaultCollectionSidePanelChange
            }
            onThemePersisted={showPreferencesSavedToast}
            onThemePersistError={showPreferencesSaveErrorToast}
          />
        );
      case "playback":
        return (
          <SettingsPlaybackPanel
            autoPlayOnQueueAdd={
              preferences?.autoPlayOnQueueAdd ?? DEFAULT_AUTO_PLAY_ON_QUEUE_ADD
            }
            extendQueueWithSimilarReleases={
              preferences?.extendQueueWithSimilarReleases ??
              DEFAULT_EXTEND_QUEUE_WITH_SIMILAR_RELEASES
            }
            isPreferencesLoading={isPreferencesLoading}
            isPreferencesSaving={isPreferencesSaving}
            onAutoPlayOnQueueAddChange={handleAutoPlayOnQueueAddChange}
            onExtendQueueWithSimilarReleasesChange={
              handleExtendQueueWithSimilarReleasesChange
            }
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
      case "support":
        return <SettingsSupportPanel />;
      case "data":
        return (
          <SettingsDataPanel
            isClearing={isClearing}
            onClearData={openClearDataDialog}
          />
        );
      default:
        return null;
    }
  };

  const renderSettingsPanel = (
    panelKey: string,
    title: string,
    lead: string | undefined,
    titleId: string,
    body: ReactNode,
    panelClassName?: string,
  ) => (
    <section
      className={panelClassName ?? styles.panel}
      aria-labelledby={titleId}
    >
      <header className={styles.panelHeader}>
        <h2 id={titleId} className={styles.panelTitle}>
          {title}
        </h2>
        {lead ? <p className={styles.panelLead}>{lead}</p> : null}
      </header>
      <ScrollRevealOnce key={panelKey} className={styles.panelBody}>
        {body}
      </ScrollRevealOnce>
    </section>
  );

  return (
    <>
      <Page>
        <CollectionPlaybackPageShell currentPage="settings" hideFilters>
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

                <div className={styles.panelStack}>
                  {activeSection === "account" ? (
                    <>
                      {renderSettingsPanel(
                        activeSection,
                        activeSectionMeta?.label ?? "Account",
                        activeSectionMeta?.description,
                        "settings-panel-title",
                        renderActivePanel(),
                      )}
                      {renderSettingsPanel(
                        `${activeSection}-logout`,
                        "Complete logout",
                        SETTINGS_COMPLETE_LOGOUT_PANEL_DESCRIPTION,
                        "settings-complete-logout-title",
                        <SettingsAccountCompleteLogoutPanel
                          authState={authState}
                          onCompleteLogout={() =>
                            setShowCompleteLogoutDialog(true)
                          }
                        />,
                      )}
                    </>
                  ) : (
                    renderSettingsPanel(
                      activeSection,
                      activeSectionMeta?.label ?? "Settings",
                      activeSectionMeta?.description,
                      "settings-panel-title",
                      renderActivePanel(),
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollectionPlaybackPageShell>
      </Page>

      <ConfirmDialog
        isOpen={showCompleteLogoutDialog}
        title="Complete logout"
        message={SETTINGS_COMPLETE_LOGOUT_DIALOG_MESSAGE}
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

      <ClearAllDataConfirmDialog
        isOpen={isClearDataDialogOpen}
        onClose={closeClearDataDialog}
        onConfirm={() => {
          void handleConfirmClear();
        }}
        isConfirming={isClearing}
      />
    </>
  );
}
