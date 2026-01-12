"use client";

import type { ReactNode } from "react";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicPageHeader } from "src/components/PublicPageHeader/PublicPageHeader.component";
import styles from "./AppPageLayout.module.css";

interface AppPageLayoutProps {
  children: ReactNode;
  currentPage?: "about" | "legal";
  header?: ReactNode;
  showFooter?: boolean;
}

export function AppPageLayout({
  children,
  currentPage,
  header,
  showFooter = true,
}: AppPageLayoutProps) {
  return (
    <>
      {header ?? <PublicPageHeader {...(currentPage ? { currentPage } : {})} />}
      <main className={styles.main}>{children}</main>
      {showFooter && <PageFooter />}
    </>
  );
}
