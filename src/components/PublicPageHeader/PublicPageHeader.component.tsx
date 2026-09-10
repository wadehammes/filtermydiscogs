"use client";

import classNames from "classnames";
import Link from "next/link";
import { SITE_NAME, SITE_WORDMARK } from "src/constants/siteMetadata";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import InstagramIcon from "src/styles/icons/instagram.svg";
import typography from "src/styles/modules/typography.module.css";
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

const getNavLinkClassName = ({
  currentPage,
  page,
  variant,
}: {
  currentPage: PublicPageHeaderProps["currentPage"];
  page: (typeof PUBLIC_NAV_ITEMS)[number]["page"];
  variant: PublicPageHeaderProps["variant"];
}) => {
  const isActive = currentPage === page;
  const isGradient = variant === "gradient";

  return classNames(styles.navLink, {
    [styles.navLinkActive]: isActive && !isGradient,
    [styles.navLinkGradient]: isGradient,
    [styles.navLinkGradientActive]: isActive && isGradient,
  });
};

export const PublicPageHeader = ({
  currentPage,
  variant = "default",
}: PublicPageHeaderProps) => {
  const isGradient = variant === "gradient";

  return (
    <header
      className={classNames(styles.header, {
        [styles.headerGradient]: isGradient,
      })}
    >
      <div className={styles.headerContent}>
        <Link href="/" className={styles.logoLink} aria-label={SITE_NAME}>
          <FMDIcon aria-hidden className={styles.logoIcon} />
          <span className={typography.siteWordmark}>{SITE_WORDMARK}</span>
        </Link>
        <nav className={styles.navBar} aria-label="Public">
          <div className={styles.linkGroup}>
            {PUBLIC_NAV_ITEMS.map(({ page, href, label }) => (
              <Link
                key={page}
                href={href}
                className={getNavLinkClassName({
                  currentPage,
                  page,
                  variant,
                })}
                {...(currentPage === page ? { "aria-current": "page" } : {})}
              >
                {label}
              </Link>
            ))}
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
      </div>
    </header>
  );
};
