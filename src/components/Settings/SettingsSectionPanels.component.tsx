"use client";

import { useState } from "react";
import Button from "src/components/Button/Button.component";
import { SaveFilterViewDialog } from "src/components/SaveFilterViewDialog/SaveFilterViewDialog.component";
import Select from "src/components/Select/Select.component";
import { SettingsBooleanPreferenceToggle } from "src/components/Settings/SettingsBooleanPreferenceToggle.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";
import type { AuthState } from "src/context/auth.context";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import {
  type FilterView,
  formatFilterViewSummary,
} from "src/utils/filterViews";
import styles from "./SettingsClient.module.css";

type SettingsAccountPanelProps = {
  authState: AuthState;
  onCompleteLogout: () => void;
};

export function SettingsAccountPanel({
  authState,
  onCompleteLogout,
}: SettingsAccountPanelProps) {
  return (
    <>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Discogs username</span>
        <p className={styles.fieldValue}>{authState.username}</p>
      </div>
      <div className={styles.panelBlock}>
        <h3 className={styles.panelBlockTitle}>Complete logout</h3>
        <p className={styles.sectionDescription}>
          Sign out and revoke stored OAuth tokens on this browser. Your crates
          and preferences stay saved—you can sign in again with Discogs when you
          are ready.
        </p>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="md"
            onPress={onCompleteLogout}
            disabled={authState.isLoggingOut}
          >
            {authState.isLoggingOut ? "Logging out..." : "Complete logout"}
          </Button>
        </div>
      </div>
    </>
  );
}

type SettingsAppearancePanelProps = {
  settingsViewValue: "card" | "list";
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onViewChange: (view: "card" | "list") => void;
  onThemePersisted: () => void;
  onThemePersistError: () => void;
};

export function SettingsAppearancePanel({
  settingsViewValue,
  isPreferencesLoading,
  isPreferencesSaving,
  onViewChange,
  onThemePersisted,
  onThemePersistError,
}: SettingsAppearancePanelProps) {
  return (
    <>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Theme</span>
        <ThemeSwitcher
          variant="dropdown"
          className={styles.fieldControl}
          onThemePersisted={onThemePersisted}
          onThemePersistError={onThemePersistError}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Default view</span>
        <Select
          label="Default view"
          options={[
            { value: "card", label: "Grid" },
            { value: "list", label: "Table" },
          ]}
          value={settingsViewValue}
          onChange={(value) => {
            onViewChange(value as "card" | "list");
          }}
          disabled={isPreferencesLoading || isPreferencesSaving}
          className={styles.fieldControl}
        />
      </div>
    </>
  );
}

type SettingsPlaybackPanelProps = {
  autoPlayOnQueueAdd: boolean;
  showDjMetadataOnTracks: boolean;
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onAutoPlayOnQueueAddChange: (enabled: boolean) => void;
  onShowDjMetadataOnTracksChange: (enabled: boolean) => void;
};

export function SettingsPlaybackPanel({
  autoPlayOnQueueAdd,
  showDjMetadataOnTracks,
  isPreferencesLoading,
  isPreferencesSaving,
  onAutoPlayOnQueueAddChange,
  onShowDjMetadataOnTracksChange,
}: SettingsPlaybackPanelProps) {
  return (
    <>
      <SettingsBooleanPreferenceToggle
        checked={autoPlayOnQueueAdd}
        label="Play immediately when adding to an empty queue"
        description={
          <>
            When enabled, the first track you add to an empty queue starts
            playing right away and opens the video player. When disabled, tracks
            are queued without starting playback until you press play.
          </>
        }
        disabled={isPreferencesLoading || isPreferencesSaving}
        onChange={onAutoPlayOnQueueAddChange}
      />
      <SettingsBooleanPreferenceToggle
        checked={showDjMetadataOnTracks}
        label="Show DJ metadata on tracks"
        description="When enabled, release tracklists and gig-packing crate lists show BPM and musical key. Lookups use artist and title from your collection metadata."
        descriptionFooter={
          <>
            Data provided by{" "}
            <a
              href="https://getsongbpm.com"
              className={styles.inlineLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              GetSongBPM
            </a>
            .
          </>
        }
        disabled={isPreferencesLoading || isPreferencesSaving}
        onChange={onShowDjMetadataOnTracksChange}
      />
    </>
  );
}

type SettingsFiltersPanelProps = {
  persistFilters: boolean;
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onPersistFiltersChange: (enabled: boolean) => void;
};

export function SettingsFiltersPanel({
  persistFilters,
  isPreferencesLoading,
  isPreferencesSaving,
  onPersistFiltersChange,
}: SettingsFiltersPanelProps) {
  const { filterViews, deleteView, renameView, isSavingPreferences } =
    useFilterViews();
  const [renamingView, setRenamingView] = useState<FilterView | null>(null);

  return (
    <>
      <SettingsBooleanPreferenceToggle
        checked={persistFilters}
        label="Remember filter selections"
        description={
          <>
            When enabled, your filter and sort selections are restored the next
            time you open the app. When disabled, each visit starts with default
            filters.
          </>
        }
        disabled={isPreferencesLoading || isPreferencesSaving}
        onChange={onPersistFiltersChange}
      />

      <div className={styles.panelBlock}>
        <h3 className={styles.panelBlockTitle}>Saved views</h3>
        <p className={styles.sectionDescription}>
          Named filter snapshots you can apply from the Views menu on Releases.
          Save new views from that menu while browsing your collection.
        </p>
        {filterViews.length === 0 ? (
          <p className={styles.sectionDescription}>No saved views yet.</p>
        ) : (
          <ul className={styles.savedViewsList}>
            {filterViews.map((view) => (
              <li key={view.id} className={styles.savedViewsItem}>
                <div className={styles.savedViewsDetails}>
                  <span className={styles.savedViewsName}>{view.name}</span>
                  <p className={styles.savedViewsSummary}>
                    {formatFilterViewSummary(view.filters)}
                  </p>
                </div>
                <div className={styles.savedViewsActions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      setRenamingView(view);
                    }}
                    disabled={isSavingPreferences}
                    aria-label={`Rename ${view.name}`}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      deleteView(view.id);
                    }}
                    disabled={isSavingPreferences}
                    aria-label={`Delete ${view.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SaveFilterViewDialog
        isOpen={renamingView !== null}
        mode="rename"
        initialName={renamingView?.name ?? ""}
        isSaving={isSavingPreferences}
        onClose={() => {
          setRenamingView(null);
        }}
        onSave={(name) => {
          if (!renamingView) {
            return false;
          }

          return renameView(renamingView.id, name);
        }}
      />
    </>
  );
}

type SettingsCollectionPanelProps = {
  isSyncDisabled: boolean;
  isSyncing: boolean;
  isCollectionLoading: boolean;
  onSyncClick: () => void;
};

export function SettingsCollectionPanel({
  isSyncDisabled,
  isSyncing,
  isCollectionLoading,
  onSyncClick,
}: SettingsCollectionPanelProps) {
  return (
    <div className={styles.panelBlock}>
      <h3 className={styles.panelBlockTitle}>Sync crates</h3>
      <p className={styles.sectionDescription}>
        Remove crate entries for releases that are no longer in your Discogs
        collection.
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          onPress={onSyncClick}
          disabled={isSyncDisabled}
        >
          {isSyncing
            ? "Syncing..."
            : isCollectionLoading
              ? "Loading collection..."
              : "Sync collection"}
        </Button>
      </div>
    </div>
  );
}

type SettingsDataPanelProps = {
  isClearing: boolean;
  onClearData: () => void;
};

export function SettingsDataPanel({
  isClearing,
  onClearData,
}: SettingsDataPanelProps) {
  const {
    isAnalyticsEnabled,
    isReady: isAnalyticsConsentReady,
    setAnalyticsEnabled,
  } = useAnalyticsConsent();

  return (
    <>
      <SettingsBooleanPreferenceToggle
        checked={isAnalyticsEnabled}
        label="Allow analytics cookies"
        description={
          <>
            When enabled, Google Tag Manager may set analytics cookies to
            measure page views and interactions. Similar events may also be
            stored on our server (page path, event name, and label) to
            understand product usage, linked to your account when signed in.
            Essential Discogs login cookies always apply. See the{" "}
            <a href="/legal#cookies" className={styles.inlineLink}>
              cookie notice
            </a>{" "}
            for details. Disabling analytics reloads the page so tracking
            scripts stop running.
          </>
        }
        disabled={!isAnalyticsConsentReady}
        onChange={setAnalyticsEnabled}
      />
      <div className={styles.panelBlock}>
        <h3 className={styles.panelBlockTitle}>Clear all stored data</h3>
        <p className={styles.sectionDescription}>
          Delete your crates, product analytics events linked to your account,
          clear local preferences (including your analytics cookie choice), and
          sign out. You will need to authorize the app again to continue using
          Filter My Discogs.
        </p>
        <div className={styles.actions}>
          <Button
            variant="danger"
            size="md"
            onPress={onClearData}
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Clear all stored data"}
          </Button>
        </div>
      </div>
    </>
  );
}
