import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { SupportProjectNavLink } from "src/components/SupportProjectNavLink/SupportProjectNavLink.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { SUBMIT_BUG_REPORT_NAV_LABEL } from "src/constants/sentryUserFeedback.constants";
import { SUPPORT_PROJECT_NAV_LABEL } from "src/constants/supportProjectToast.constants";
import { useAuth } from "src/context/auth.context";
import { openSentryUserFeedback } from "src/lib/sentry/openSentryUserFeedback.client";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import Chevron from "src/styles/icons/chevron-right-thin.svg";
import { HeartThinIcon } from "src/styles/icons/HeartThinIcon.component";
import { buildDiscogsAvatarProxyUrl } from "src/utils/discogsAvatarUrl";
import styles from "./UserActions.module.css";

interface UserActionsProps {
  variant?: "mobile" | "desktop";
  showMosaic?: boolean;
  showUsername?: boolean;
  showSubmitBugReport?: boolean;
  onSubmitBugReport?: () => void;
}

export const UserActions = ({
  variant = "desktop",
  showMosaic = true,
  showUsername = true,
  showSubmitBugReport: showSubmitBugReportProp,
  onSubmitBugReport: onSubmitBugReportProp,
}: UserActionsProps) => {
  const { logout, state: authState } = useAuth();
  const { username, avatarUrl } = authState;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const showSubmitBugReport = showSubmitBugReportProp ?? resolveSentryEnabled();
  const handleSubmitBugReport =
    onSubmitBugReportProp ??
    (() => {
      void openSentryUserFeedback();
    });

  const handleLogout = useCallback(async () => {
    setIsDropdownOpen(false);
    await logout();
  }, [logout]);

  const handleMenuNavigation = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const containerClass =
    variant === "mobile" ? styles.mobileActions : styles.userSection;

  return (
    <div className={containerClass}>
      {showMosaic && (
        <Link
          href="/mosaic"
          className={styles.mosaicLink}
          aria-label="View mosaic"
        >
          <span>🖼️</span>
          <span>Mosaic</span>
        </Link>
      )}

      {showUsername && username && (
        <Menu.Root
          open={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          modal={false}
        >
          <Menu.Trigger className={styles.usernameTrigger}>
            {avatarUrl ? (
              <img
                alt=""
                className={styles.avatar}
                src={buildDiscogsAvatarProxyUrl(avatarUrl, 24)}
                loading="eager"
                width={24}
                height={24}
              />
            ) : (
              <span aria-hidden className={styles.avatarFallback}>
                {username.charAt(0).toUpperCase()}
              </span>
            )}
            <span className={styles.username}>{username}</span>
            <span className={styles.chevronIcon} aria-hidden>
              <Chevron />
            </span>
          </Menu.Trigger>
          <InlinePopoverMenu.Panel
            align="end"
            popupClassName={styles.menuPopup}
            useOverlayStack={false}
          >
            <InlinePopoverMenu.List>
              <Menu.LinkItem
                closeOnClick
                render={
                  <Link
                    href="/settings"
                    className={inlinePopoverMenuStyles.linkRow}
                  />
                }
                className={inlinePopoverMenuStyles.item}
                onClick={handleMenuNavigation}
              >
                Settings
              </Menu.LinkItem>
              <Menu.LinkItem
                closeOnClick
                render={
                  <Link
                    href="/about"
                    className={inlinePopoverMenuStyles.linkRow}
                  />
                }
                className={inlinePopoverMenuStyles.item}
                onClick={handleMenuNavigation}
              >
                About
              </Menu.LinkItem>
              {showSubmitBugReport ? (
                <Menu.Item
                  className={inlinePopoverMenuStyles.item}
                  onClick={() => {
                    handleMenuNavigation();
                    handleSubmitBugReport();
                  }}
                >
                  {SUBMIT_BUG_REPORT_NAV_LABEL}
                </Menu.Item>
              ) : null}
              <Menu.LinkItem
                closeOnClick
                render={
                  <SupportProjectNavLink
                    className={inlinePopoverMenuStyles.linkRow}
                    onClick={handleMenuNavigation}
                  />
                }
                className={inlinePopoverMenuStyles.item}
              >
                <HeartThinIcon className={styles.supportNavIcon} />
                {SUPPORT_PROJECT_NAV_LABEL}
              </Menu.LinkItem>
            </InlinePopoverMenu.List>
            <InlinePopoverMenu.Footer className={styles.menuFooterStretch}>
              <ThemeSwitcher variant="menu" />
            </InlinePopoverMenu.Footer>
            <InlinePopoverMenu.Footer>
              <Menu.Item
                className={styles.logoutItem}
                onClick={() => {
                  void handleLogout();
                }}
              >
                Logout
              </Menu.Item>
            </InlinePopoverMenu.Footer>
          </InlinePopoverMenu.Panel>
        </Menu.Root>
      )}
    </div>
  );
};
