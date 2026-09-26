"use client";

import classNames from "classnames";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { SITE_NAME, SITE_WORDMARK } from "src/constants/siteMetadata";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import InstagramIcon from "src/styles/icons/instagram.svg";
import MenuIcon from "src/styles/icons/menu.svg";
import XIcon from "src/styles/icons/x-thin.svg";
import typography from "src/styles/modules/typography.module.css";
import { definedProps } from "src/utils/definedProps";
import styles from "./PublicPageHeader.module.css";

type PublicPageHeaderProps = {
  currentPage?: "home" | "about" | "legal";
  variant?: "default" | "gradient";
};

const PUBLIC_NAV_ITEMS = [
  { page: "home", href: "/", label: "Home" },
  { page: "about", href: "/about", label: "About" },
  { page: "legal", href: "/legal", label: "Legal" },
] as const;

const PUBLIC_DESKTOP_NAV_MEDIA_QUERY = "(min-width: 768px)";

const getNavLinkClassName = ({
  currentPage,
  page,
  variant,
  linkClassName,
}: {
  currentPage: PublicPageHeaderProps["currentPage"];
  page: (typeof PUBLIC_NAV_ITEMS)[number]["page"];
  variant: PublicPageHeaderProps["variant"];
  linkClassName: string;
}) => {
  const isActive = currentPage === page;
  const isGradient = variant === "gradient";

  return classNames(linkClassName, {
    [styles.navLinkActive]: isActive && !isGradient,
    [styles.navLinkGradient]: isGradient,
    [styles.navLinkGradientActive]: isActive && isGradient,
  });
};

const PublicPageHeaderNavLinks = ({
  currentPage,
  variant,
  linkClassName,
  menuItemClassName,
  onNavigate,
}: {
  currentPage: PublicPageHeaderProps["currentPage"];
  variant: PublicPageHeaderProps["variant"];
  linkClassName: string;
  menuItemClassName?: string;
  onNavigate?: () => void;
}) => {
  return (
    <>
      {PUBLIC_NAV_ITEMS.map(({ page, href, label }) => (
        <Link
          key={page}
          href={href}
          className={classNames(
            getNavLinkClassName({
              currentPage,
              page,
              variant,
              linkClassName,
            }),
            menuItemClassName,
            menuItemClassName && currentPage === page
              ? styles.menuItemActive
              : undefined,
          )}
          {...definedProps({ onClick: onNavigate })}
          {...(currentPage === page ? { "aria-current": "page" as const } : {})}
        >
          {label}
        </Link>
      ))}
    </>
  );
};

export const PublicPageHeader = ({
  currentPage,
  variant = "default",
}: PublicPageHeaderProps) => {
  const isGradient = variant === "gradient";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDesktopNav = useMediaQuery(PUBLIC_DESKTOP_NAV_MEDIA_QUERY, false);
  const isMiniPlayerVisible = useIsMiniPlayerVisible();

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    if (isDesktopNav) {
      closeMenu();
    }
  }, [closeMenu, isDesktopNav]);

  return (
    <header
      className={classNames(styles.header, {
        [styles.headerGradient]: isGradient,
      })}
      data-testid="fmdPublicPageHeader"
    >
      <div className={styles.headerContent}>
        <Link href="/" className={styles.logoLink} aria-label={SITE_NAME}>
          <FMDIcon aria-hidden className={styles.logoIcon} />
          <span className={typography.siteWordmark}>{SITE_WORDMARK}</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Public">
          <div className={styles.linkGroup}>
            <PublicPageHeaderNavLinks
              currentPage={currentPage}
              variant={variant}
              linkClassName={styles.navLink}
            />
            <a
              href="/api/auth/discogs"
              className={classNames(styles.navLink, {
                [styles.navLinkGradient]: isGradient,
              })}
            >
              Log in
            </a>
          </div>
          <div className={styles.navActions}>
            <a
              href="https://www.instagram.com/filtermydiscogs"
              target="_blank"
              rel="noopener noreferrer"
              className={classNames(styles.socialLink, {
                [styles.socialLinkGradient]: isGradient,
              })}
              aria-label="Follow @filtermydiscogs on Instagram"
            >
              <InstagramIcon className={styles.socialIcon} />
            </a>
          </div>
        </nav>

        <div className={styles.mobileControls}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="public-mobile-menu-title"
            data-popup-open={isMenuOpen ? true : undefined}
          >
            {isMenuOpen ? (
              <XIcon className={styles.menuIcon} aria-hidden />
            ) : (
              <MenuIcon className={styles.menuIcon} aria-hidden />
            )}
          </button>
        </div>
      </div>

      <BottomDrawer
        isOpen={isMenuOpen}
        onClose={closeMenu}
        chrome
        contentFlush
        title="Menu"
        titleId="public-mobile-menu-title"
        closeButtonAriaLabel="Close menu"
        headerClassName={styles.menuDrawerHeader}
        dataAttribute="data-public-mobile-menu-open"
        aboveMiniPlayer={isMiniPlayerVisible}
      >
        <div className={styles.menuBody}>
          <nav className={styles.menuNav} aria-label="Public">
            <PublicPageHeaderNavLinks
              currentPage={currentPage}
              variant={variant}
              linkClassName={styles.navLink}
              menuItemClassName={styles.menuItem}
              onNavigate={closeMenu}
            />
            <a
              href="/api/auth/discogs"
              className={classNames(styles.menuItem, styles.menuItemLogin, {
                [styles.navLinkGradient]: isGradient,
              })}
              onClick={closeMenu}
            >
              Log in
            </a>
          </nav>
          <div className={styles.menuFooter}>
            <a
              href="https://www.instagram.com/filtermydiscogs"
              target="_blank"
              rel="noopener noreferrer"
              className={classNames(styles.menuFooterLink, {
                [styles.socialLinkGradient]: isGradient,
              })}
              onClick={closeMenu}
            >
              <InstagramIcon className={styles.socialIcon} aria-hidden />
              <span>@filtermydiscogs</span>
            </a>
          </div>
        </div>
      </BottomDrawer>
    </header>
  );
};
