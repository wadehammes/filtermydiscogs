"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import styles from "./DashboardSection.module.css";

interface DashboardSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <div className={classNames(styles.section, className)}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}
