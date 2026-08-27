"use client";

import Button from "src/components/Button/Button.component";
import Select from "src/components/Select/Select.component";
import { SettingsBooleanPreferenceToggle } from "src/components/Settings/SettingsBooleanPreferenceToggle.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";
import type { AuthState } from "src/context/auth.context";
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
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onAutoPlayOnQueueAddChange: (enabled: boolean) => void;
};

export function SettingsPlaybackPanel({
  autoPlayOnQueueAdd,
  isPreferencesLoading,
  isPreferencesSaving,
  onAutoPlayOnQueueAddChange,
}: SettingsPlaybackPanelProps) {
  return (
    <SettingsBooleanPreferenceToggle
      checked={autoPlayOnQueueAdd}
      label="Play immediately when adding to an empty queue"
      description={
        <>
          When enabled, the first track you add to an empty queue starts playing
          right away and opens the video player. When disabled, tracks are
          queued without starting playback until you press play.
        </>
      }
      disabled={isPreferencesLoading || isPreferencesSaving}
      onChange={onAutoPlayOnQueueAddChange}
    />
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
  return (
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
