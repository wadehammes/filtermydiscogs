"use client";

import Link from "next/link";
import Logo from "src/styles/icons/fmd-logo.svg";
import InstagramIcon from "src/styles/icons/instagram.svg";
import styles from "./PublicPageHeader.module.css";

type PublicPageHeaderProps = {
  currentPage?: "about" | "legal";
};

export function PublicPageHeader({ currentPage }: PublicPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href="/" className={styles.logoLink}>
          <Logo className={styles.logo} />
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link
            href="/about"
            className={`${styles.navLink} ${
              currentPage === "about" ? styles.active : ""
            }`}
          >
            About
          </Link>
          <Link
            href="/legal"
            className={`${styles.navLink} ${
              currentPage === "legal" ? styles.active : ""
            }`}
          >
            Legal
          </Link>
          <a
            href="https://www.instagram.com/filtermydiscogs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="Follow @filtermydiscogs on Instagram"
          >
            <InstagramIcon className={styles.socialIcon} />
          </a>
        </nav>
      </div>
    </header>
  );
}
