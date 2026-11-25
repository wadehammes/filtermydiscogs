"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import {
  type FocusEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { SaveFilterViewDialog } from "src/components/SaveFilterViewDialog/SaveFilterViewDialog.component";
import Select from "src/components/Select/Select.component";
import { SettingsBooleanPreferenceToggle } from "src/components/Settings/SettingsBooleanPreferenceToggle.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import {
  SETTINGS_EMAIL_FIELD_DESCRIPTION,
  SETTINGS_EMAIL_FIELD_LABEL,
  SETTINGS_EMAIL_PENDING_STATUS,
  SETTINGS_EMAIL_RESEND_VERIFICATION_LABEL,
  SETTINGS_EMAIL_STATUS_PENDING_LABEL,
  SETTINGS_EMAIL_STATUS_UNVERIFIED_LABEL,
  SETTINGS_EMAIL_STATUS_VERIFIED_LABEL,
  SETTINGS_EMAIL_UNVERIFIED_STATUS,
  SETTINGS_MARKETING_EMAILS_DESCRIPTION,
  SETTINGS_MARKETING_EMAILS_LABEL,
} from "src/constants/settingsCopy.constants";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";
import type { AuthState } from "src/context/auth.context";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import {
  type SettingsAccountEmailFormValues,
  settingsAccountEmailFormSchema,
} from "src/lib/validation/userContact.schemas";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import { ClockThinIcon } from "src/styles/icons/ClockThinIcon.component";
import type { CollectionSidePanelPreference } from "src/types/userPreferences.types";
import {
  type FilterView,
  formatFilterViewSummary,
} from "src/utils/filterViews";
import { canResendEmailVerification } from "src/utils/userContactVerification";
import styles from "./SettingsClient.module.css";

type SettingsAccountPanelProps = {
  authState: AuthState;
  savedEmail: string | null;
  pendingEmail: string | null;
  emailVerified: boolean;
  marketingEmailsOptIn: boolean;
  isContactLoading: boolean;
  isContactSaving: boolean;
  onPersistEmail: (email: string) => void;
  onResendEmailVerification: () => void;
  onMarketingEmailsOptInChange: (enabled: boolean) => void;
};

export const SettingsAccountPanel = ({
  authState,
  savedEmail,
  pendingEmail,
  emailVerified,
  marketingEmailsOptIn,
  isContactLoading,
  isContactSaving,
  onPersistEmail,
  onResendEmailVerification,
  onMarketingEmailsOptInChange,
}: SettingsAccountPanelProps) => {
  const contactFieldsDisabled = isContactLoading || isContactSaving;
  const displayEmail = pendingEmail ?? savedEmail ?? "";
  const marketingDisabled =
    contactFieldsDisabled || !emailVerified || pendingEmail != null;
  const contactSnapshot = {
    email: savedEmail,
    pendingEmail,
    emailVerified,
    marketingEmailsOptIn,
  };
  const showResendVerification = canResendEmailVerification(contactSnapshot);
  const emailStatusMessage =
    pendingEmail != null
      ? SETTINGS_EMAIL_PENDING_STATUS(pendingEmail)
      : savedEmail != null && savedEmail.trim() !== "" && !emailVerified
        ? SETTINGS_EMAIL_UNVERIFIED_STATUS(savedEmail)
        : null;
  const showVerifiedStatus =
    pendingEmail == null &&
    savedEmail != null &&
    savedEmail.trim() !== "" &&
    emailVerified;
  const showPendingStatus = pendingEmail != null;
  const showUnverifiedStatus =
    pendingEmail == null &&
    savedEmail != null &&
    savedEmail.trim() !== "" &&
    !emailVerified;
  const isFocusedRef = useRef(false);

  const {
    register,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SettingsAccountEmailFormValues>({
    resolver: zodResolver(settingsAccountEmailFormSchema),
    defaultValues: { email: displayEmail },
    mode: "onBlur",
  });

  useEffect(() => {
    if (!(isFocusedRef.current || isContactLoading)) {
      reset({ email: displayEmail });
    }
  }, [isContactLoading, displayEmail, reset]);

  const persistEmailIfChanged = useCallback(
    async (trimmedEmail: string) => {
      if (isContactSaving) {
        return;
      }

      const isValid = await trigger("email");

      if (!isValid) {
        return;
      }

      const savedTrimmed = displayEmail.trim();

      if (trimmedEmail === savedTrimmed) {
        return;
      }

      onPersistEmail(trimmedEmail);
    },
    [isContactSaving, displayEmail, onPersistEmail, trigger],
  );

  const { onBlur, onChange, ...emailFieldProps } = register("email");

  const handleEmailBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      onBlur(event);

      const trimmed = event.target.value.trim();

      if (trimmed !== event.target.value) {
        setValue("email", trimmed, { shouldValidate: true });
      }

      void persistEmailIfChanged(trimmed);
    },
    [onBlur, persistEmailIfChanged, setValue],
  );

  const handleEmailFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const emailErrorMessage = errors.email?.message;

  return (
    <>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Discogs username</span>
        <p className={styles.fieldValue}>{authState.username}</p>
      </div>
      <div className={styles.panelBlock}>
        <label className={styles.field} htmlFor="settings-account-email">
          <span className={styles.fieldLabel}>
            {SETTINGS_EMAIL_FIELD_LABEL}
          </span>
          <div className={styles.emailFieldRow}>
            <input
              id="settings-account-email"
              type="email"
              autoComplete="email"
              data-1p-ignore
              className={classNames(styles.emailInput, {
                [styles.emailInputInvalid]: emailErrorMessage != null,
              })}
              disabled={contactFieldsDisabled}
              aria-invalid={emailErrorMessage != null ? true : undefined}
              aria-describedby={
                [
                  emailErrorMessage ? "settings-account-email-error" : null,
                  emailStatusMessage ? "settings-account-email-status" : null,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              onBlur={handleEmailBlur}
              onChange={onChange}
              onFocus={handleEmailFocus}
              {...emailFieldProps}
            />
            <div className={styles.emailFieldStatus}>
              {showVerifiedStatus ? (
                <span
                  className={styles.emailStatusIconVerified}
                  title={SETTINGS_EMAIL_STATUS_VERIFIED_LABEL}
                >
                  <CheckThinIcon width={18} height={18} aria-hidden />
                </span>
              ) : null}
              {showPendingStatus ? (
                <span
                  className={styles.emailStatusIconPending}
                  title={SETTINGS_EMAIL_STATUS_PENDING_LABEL}
                >
                  <ClockThinIcon width={18} height={18} aria-hidden />
                </span>
              ) : null}
              {showUnverifiedStatus ? (
                <span
                  className={styles.emailStatusIconPending}
                  title={SETTINGS_EMAIL_STATUS_UNVERIFIED_LABEL}
                >
                  <ClockThinIcon width={18} height={18} aria-hidden />
                </span>
              ) : null}
            </div>
          </div>
        </label>
        {emailErrorMessage ? (
          <p
            id="settings-account-email-error"
            className={styles.fieldError}
            role="alert"
          >
            {emailErrorMessage}
          </p>
        ) : null}
        <p className={styles.sectionDescription}>
          {SETTINGS_EMAIL_FIELD_DESCRIPTION}
        </p>
        {emailStatusMessage ? (
          <p
            id="settings-account-email-status"
            className={styles.sectionDescription}
            role="status"
          >
            {emailStatusMessage}
          </p>
        ) : null}
        {showResendVerification ? (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              disabled={contactFieldsDisabled}
              onPress={onResendEmailVerification}
            >
              {SETTINGS_EMAIL_RESEND_VERIFICATION_LABEL}
            </Button>
          </div>
        ) : null}
      </div>
      <SettingsBooleanPreferenceToggle
        checked={marketingEmailsOptIn}
        label={SETTINGS_MARKETING_EMAILS_LABEL}
        description={SETTINGS_MARKETING_EMAILS_DESCRIPTION}
        disabled={marketingDisabled}
        onChange={onMarketingEmailsOptInChange}
      />
    </>
  );
};

type SettingsAccountCompleteLogoutPanelProps = {
  authState: AuthState;
  onCompleteLogout: () => void;
};

export const SettingsAccountCompleteLogoutPanel = ({
  authState,
  onCompleteLogout,
}: SettingsAccountCompleteLogoutPanelProps) => (
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
);

type SettingsAppearancePanelProps = {
  settingsViewValue: "card" | "list";
  defaultCollectionSidePanel: CollectionSidePanelPreference;
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onViewChange: (view: "card" | "list") => void;
  onDefaultCollectionSidePanelChange: (
    panel: CollectionSidePanelPreference,
  ) => void;
  onThemePersisted: () => void;
  onThemePersistError: () => void;
};

export const SettingsAppearancePanel = ({
  settingsViewValue,
  defaultCollectionSidePanel,
  isPreferencesLoading,
  isPreferencesSaving,
  onViewChange,
  onDefaultCollectionSidePanelChange,
  onThemePersisted,
  onThemePersistError,
}: SettingsAppearancePanelProps) => {
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
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Default collection panel</span>
        <Select
          label="Default collection panel"
          options={[
            { value: "crates", label: "Crates" },
            { value: "playlists", label: "Playlists" },
          ]}
          value={defaultCollectionSidePanel}
          onChange={(value) => {
            onDefaultCollectionSidePanelChange(
              value as CollectionSidePanelPreference,
            );
          }}
          disabled={isPreferencesLoading || isPreferencesSaving}
          className={styles.fieldControl}
        />
        <p className={styles.sectionDescription}>
          On desktop, which side panel opens when you load Releases. You can
          still switch panels anytime from the collection toolbar.
        </p>
      </div>
    </>
  );
};

type SettingsPlaybackPanelProps = {
  autoPlayOnQueueAdd: boolean;
  extendQueueWithSimilarReleases: boolean;
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onAutoPlayOnQueueAddChange: (enabled: boolean) => void;
  onExtendQueueWithSimilarReleasesChange: (enabled: boolean) => void;
};

export const SettingsPlaybackPanel = ({
  autoPlayOnQueueAdd,
  extendQueueWithSimilarReleases,
  isPreferencesLoading,
  isPreferencesSaving,
  onAutoPlayOnQueueAddChange,
  onExtendQueueWithSimilarReleasesChange,
}: SettingsPlaybackPanelProps) => {
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
        checked={extendQueueWithSimilarReleases}
        label="Extend queue with similar releases"
        description={
          <>
            When enabled, one related track from your collection is added to up
            next when the queue runs low. When disabled, up next is only tracks
            you add or the rest of the current album.
          </>
        }
        disabled={isPreferencesLoading || isPreferencesSaving}
        onChange={onExtendQueueWithSimilarReleasesChange}
      />
    </>
  );
};

type SettingsFiltersPanelProps = {
  persistFilters: boolean;
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onPersistFiltersChange: (enabled: boolean) => void;
};

export const SettingsFiltersPanel = ({
  persistFilters,
  isPreferencesLoading,
  isPreferencesSaving,
  onPersistFiltersChange,
}: SettingsFiltersPanelProps) => {
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
          Named filter snapshots you can apply from the Views menu on
          Collection. Save new views from that menu while browsing your
          collection.
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
};

type SettingsCollectionPanelProps = {
  isSyncDisabled: boolean;
  isSyncing: boolean;
  isCollectionLoading: boolean;
  onSyncClick: () => void;
};

export const SettingsCollectionPanel = ({
  isSyncDisabled,
  isSyncing,
  isCollectionLoading,
  onSyncClick,
}: SettingsCollectionPanelProps) => {
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
};

type SettingsDataPanelProps = {
  isClearing: boolean;
  onClearData: () => void;
};

export const SettingsDataPanel = ({
  isClearing,
  onClearData,
}: SettingsDataPanelProps) => {
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
};
