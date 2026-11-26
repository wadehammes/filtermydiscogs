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
import { DonationCheckoutForm } from "src/components/DonationCheckoutForm/DonationCheckoutForm.component";
import { SaveFilterViewDialog } from "src/components/SaveFilterViewDialog/SaveFilterViewDialog.component";
import Select from "src/components/Select/Select.component";
import { SettingsBooleanPreferenceToggle } from "src/components/Settings/SettingsBooleanPreferenceToggle.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { ABOUT_DATA_DELETION_ITEMS } from "src/constants/about.constants";
import {
  CLEAR_ALL_DATA_ACTION_LABEL,
  CLEAR_ALL_DATA_ACTION_LOADING_LABEL,
  CLEAR_ALL_DATA_PANEL_LEAD,
} from "src/constants/clearData.constants";
import {
  SETTINGS_EMAIL_FIELD_DESCRIPTION,
  SETTINGS_EMAIL_FIELD_LABEL,
  SETTINGS_EMAIL_RESEND_VERIFICATION_LABEL,
  SETTINGS_EMAIL_SAVE_LABEL,
  SETTINGS_EMAIL_STATUS_VERIFIED_LABEL,
  SETTINGS_MARKETING_EMAILS_DESCRIPTION,
  SETTINGS_MARKETING_EMAILS_LABEL,
  SETTINGS_SUPPORT_PANEL_DESCRIPTION,
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
import accountDeletionCard from "src/styles/modules/account-deletion-card.module.css";
import emailVerificationNotice from "src/styles/modules/settings-email-verification-notice.module.css";
import type { CollectionSidePanelPreference } from "src/types/userPreferences.types";
import {
  type FilterView,
  formatFilterViewSummary,
} from "src/utils/filterViews";
import { getEmailVerificationUiState } from "src/utils/settingsEmailVerificationUi";
import { contactEmailsMatch } from "src/utils/userContact.helpers";
import styles from "./SettingsClient.module.css";
import { SETTINGS_PLAYBACK_EXTEND_QUEUE_SIMILAR_SETTING_ID } from "./settingsSections.constants";

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
  const emailVerificationUi = getEmailVerificationUiState({
    email: savedEmail,
    pendingEmail,
    emailVerified,
    marketingEmailsOptIn,
  });
  const {
    emailStatusMessage,
    icon: emailStatusIcon,
    iconTitle: emailStatusIconTitle,
    showResendVerification,
  } = emailVerificationUi;
  const isFocusedRef = useRef(false);

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
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

  const { onBlur, onChange, ...emailFieldProps } = register("email");

  const handleEmailBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      onBlur(event);

      const trimmed = event.target.value.trim();

      if (trimmed !== event.target.value) {
        setValue("email", trimmed, { shouldValidate: true, shouldDirty: true });
      }
    },
    [onBlur, setValue],
  );

  const emailErrorMessage = errors.email?.message;

  const saveEmail = handleSubmit((values) => {
    const trimmedEmail = values.email.trim();

    if (contactEmailsMatch(trimmedEmail, displayEmail)) {
      return;
    }

    onPersistEmail(trimmedEmail);
  });

  const saveEmailDisabled =
    contactFieldsDisabled || !isDirty || emailErrorMessage != null;

  const handleEmailFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  return (
    <>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Discogs username</span>
        <p className={styles.fieldValue}>{authState.username}</p>
      </div>
      <div className={styles.panelBlock}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="settings-account-email">
            {SETTINGS_EMAIL_FIELD_LABEL}
          </label>
          <div className={styles.emailFieldRow}>
            <div
              className={classNames(styles.emailInputGroup, {
                [styles.emailInputGroupInvalid]: emailErrorMessage != null,
              })}
            >
              <input
                id="settings-account-email"
                type="email"
                autoComplete="email"
                data-1p-ignore
                className={styles.emailInput}
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
              <Button
                variant="secondary"
                size="sm"
                className={styles.emailSaveButton}
                disabled={saveEmailDisabled}
                isLoading={isContactSaving}
                loadingText="Saving..."
                onPress={() => {
                  void saveEmail();
                }}
              >
                {SETTINGS_EMAIL_SAVE_LABEL}
              </Button>
            </div>
            <div className={styles.emailFieldStatus}>
              {emailStatusIcon === "verified" ? (
                <span
                  className={styles.emailStatusIconVerified}
                  title={
                    emailStatusIconTitle ?? SETTINGS_EMAIL_STATUS_VERIFIED_LABEL
                  }
                >
                  <CheckThinIcon width={18} height={18} aria-hidden />
                </span>
              ) : null}
              {emailStatusIcon === "pending" ||
              emailStatusIcon === "unverified" ? (
                <span
                  className={styles.emailStatusIconPending}
                  title={emailStatusIconTitle ?? undefined}
                >
                  <ClockThinIcon width={18} height={18} aria-hidden />
                </span>
              ) : null}
            </div>
          </div>
        </div>
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
          <div
            className={classNames(
              emailVerificationNotice.shell,
              emailStatusIcon === "unverified"
                ? emailVerificationNotice.shellWarning
                : emailVerificationNotice.shellInfo,
            )}
            data-testid="fmdSettingsEmailVerificationNotice"
          >
            <p
              id="settings-account-email-status"
              className={classNames(
                emailVerificationNotice.message,
                emailStatusIcon === "unverified"
                  ? emailVerificationNotice.messageWarning
                  : emailVerificationNotice.messageInfo,
              )}
              role="status"
            >
              {emailStatusMessage}
            </p>
            {showResendVerification ? (
              <div className={emailVerificationNotice.actions}>
                <Button
                  variant="secondary"
                  size="sm"
                  className={emailVerificationNotice.resendButton}
                  disabled={contactFieldsDisabled}
                  onPress={onResendEmailVerification}
                >
                  {SETTINGS_EMAIL_RESEND_VERIFICATION_LABEL}
                </Button>
              </div>
            ) : null}
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
  squareCorners: boolean;
  isPreferencesLoading: boolean;
  isPreferencesSaving: boolean;
  onViewChange: (view: "card" | "list") => void;
  onDefaultCollectionSidePanelChange: (
    panel: CollectionSidePanelPreference,
  ) => void;
  onSquareCornersChange: (enabled: boolean) => void;
  onThemePersisted: () => void;
  onThemePersistError: () => void;
};

export const SettingsAppearancePanel = ({
  settingsViewValue,
  defaultCollectionSidePanel,
  squareCorners,
  isPreferencesLoading,
  isPreferencesSaving,
  onViewChange,
  onDefaultCollectionSidePanelChange,
  onSquareCornersChange,
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
      <SettingsBooleanPreferenceToggle
        checked={squareCorners}
        label="Square corners"
        description={
          <>
            When enabled, cards, buttons, fields, and panels use sharp corners
            instead of rounded ones.
          </>
        }
        disabled={isPreferencesLoading || isPreferencesSaving}
        onChange={onSquareCornersChange}
      />
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
        settingId={SETTINGS_PLAYBACK_EXTEND_QUEUE_SIMILAR_SETTING_ID}
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

export const SettingsSupportPanel = () => (
  <div className={styles.panelBlock}>
    <p className={styles.sectionDescription}>
      {SETTINGS_SUPPORT_PANEL_DESCRIPTION}
    </p>
    <DonationCheckoutForm
      embedded
      returnTo="settings"
      customAmountInputId="settings-donation-custom-amount"
    />
  </div>
);

export const SettingsDataPanel = () => {
  const {
    isAnalyticsEnabled,
    isReady: isAnalyticsConsentReady,
    setAnalyticsEnabled,
  } = useAnalyticsConsent();

  return (
    <SettingsBooleanPreferenceToggle
      checked={isAnalyticsEnabled}
      label="Allow analytics cookies"
      description={
        <>
          When enabled, Google Tag Manager may set analytics cookies to measure
          page views and interactions. Similar events may also be stored on our
          server (page path, event name, and label) to understand product usage,
          linked to your account when signed in. Essential Discogs login cookies
          always apply. See the{" "}
          <a href="/legal#cookies" className={styles.inlineLink}>
            cookie notice
          </a>{" "}
          for details. Disabling analytics reloads the page so tracking scripts
          stop running.
        </>
      }
      disabled={!isAnalyticsConsentReady}
      onChange={setAnalyticsEnabled}
    />
  );
};

type SettingsDeleteAccountPanelProps = {
  isClearing: boolean;
  onClearData: () => void;
};

export const SettingsDeleteAccountPanel = ({
  isClearing,
  onClearData,
}: SettingsDeleteAccountPanelProps) => (
  <>
    <p className={styles.sectionDescription}>{CLEAR_ALL_DATA_PANEL_LEAD}</p>
    <ul className={accountDeletionCard["deletion-list"]}>
      {ABOUT_DATA_DELETION_ITEMS.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    <div className={accountDeletionCard["deletion-actions"]}>
      <Button
        variant="danger"
        size="md"
        onPress={onClearData}
        disabled={isClearing}
      >
        {isClearing
          ? CLEAR_ALL_DATA_ACTION_LOADING_LABEL
          : CLEAR_ALL_DATA_ACTION_LABEL}
      </Button>
    </div>
  </>
);
