"use client";

import classNames from "classnames";
import Link from "next/link";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import Logo from "src/styles/icons/fmd-logo.svg";
import InstagramIcon from "src/styles/icons/instagram.svg";
import navStyles from "src/styles/nav-links.module.css";
import styles from "./PublicPageHeader.module.css";

type PublicPageHeaderProps = {
  currentPage?: "home" | "about" | "legal";
  variant?: "default" | "gradient";
};

const getNavLinkClassName = ({
  currentPage,
  page,
  variant,
}: {
  currentPage: PublicPageHeaderProps["currentPage"];
  page: NonNullable<PublicPageHeaderProps["currentPage"]>;
  variant: PublicPageHeaderProps["variant"];
}) => {
  const isActive = currentPage === page;
  const isGradient = variant === "gradient";

  return classNames(navStyles.link, {
    [navStyles.linkActive]: isActive && !isGradient,
    [styles.navLinkGradient]: isGradient,
    [styles.navLinkGradientActive]: isActive && isGradient,
  });
};

export const PublicPageHeader = ({
  currentPage,
  variant = "default",
}: PublicPageHeaderProps) => {
  return (
    <header
      className={classNames(styles.header, {
        [styles.headerGradient]: variant === "gradient",
      })}
    >
      <div className={styles.headerContent}>
        <Link href="/" className={styles.logoLink}>
          <Logo className={styles.logo} />
        </Link>
        <nav className={navStyles.bar}>
          <div className={navStyles.linkGroup}>
            <Link
              href="/"
              className={getNavLinkClassName({
                currentPage,
                page: "home",
                variant,
              })}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={getNavLinkClassName({
                currentPage,
                page: "about",
                variant,
              })}
            >
              About
            </Link>
            <Link
              href="/legal"
              className={getNavLinkClassName({
                currentPage,
                page: "legal",
                variant,
              })}
            >
              Legal
            </Link>
            <Link
              href="/api/auth/discogs?force=1"
              className={classNames(navStyles.link, {
                [styles.navLinkGradient]: variant === "gradient",
              })}
            >
              Log in
            </Link>
          </div>
          <div className={navStyles.actions}>
            <ThemeSwitcher variant="segmented" />
            <a
              href="https://www.instagram.com/filtermydiscogs"
              target="_blank"
              rel="noopener noreferrer"
              className={classNames(styles.socialLink, {
                [styles.socialLinkGradient]: variant === "gradient",
              })}
              aria-label="Follow @filtermydiscogs on Instagram"
            >
              <InstagramIcon className={styles.socialIcon} />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};
