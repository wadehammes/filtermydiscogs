"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { PublicAuthHeader } from "src/components/PublicAuthLayout/PublicAuthHeader.component";
import styles from "./PublicAuthLayout.module.css";

type PublicAuthLayoutProps = {
  authenticatedNavPage?: "about" | "legal";
  centerMain?: boolean;
  children: ReactNode;
  currentPage?: "home" | "about" | "legal";
  footer?: ReactNode;
  header?: ReactNode;
};

export const PublicAuthLayout = ({
  authenticatedNavPage,
  centerMain = false,
  children,
  currentPage = "home",
  footer,
  header,
}: PublicAuthLayoutProps) => {
  return (
    <div className={styles.container} data-testid="fmdPublicAuthLayout">
      {header ?? (
        <PublicAuthHeader
          currentPage={currentPage}
          {...(authenticatedNavPage ? { authenticatedNavPage } : {})}
        />
      )}
      <main
        className={classNames(styles.main, {
          [styles.mainCentered as string]: centerMain,
        })}
      >
        {children}
      </main>
      {footer}
    </div>
  );
};
