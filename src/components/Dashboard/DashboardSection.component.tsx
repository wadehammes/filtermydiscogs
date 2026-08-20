import classNames from "classnames";
import type { ReactNode } from "react";
import styles from "./DashboardSection.module.css";

interface DashboardSectionProps {
  title: string;
  lede: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function DashboardSection({
  title,
  lede,
  children,
  className,
  id,
}: DashboardSectionProps) {
  const sectionId = id ?? title.toLowerCase().replace(/\s+/g, "-");

  return (
    <section
      aria-labelledby={`${sectionId}-title`}
      className={classNames(styles.section, className)}
      data-testid="fmdDashboardSection"
    >
      <header className={styles.header}>
        <h2 className={styles.title} id={`${sectionId}-title`}>
          {title}
        </h2>
        <p className={styles.lede}>{lede}</p>
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
