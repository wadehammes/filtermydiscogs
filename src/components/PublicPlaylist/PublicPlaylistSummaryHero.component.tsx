"use client";

import classNames from "classnames";
import Image from "next/image";
import type { ReactNode } from "react";
import typographyStyles from "src/styles/modules/typography.module.css";
import styles from "./PublicPlaylistSummaryHero.module.css";

export interface PublicPlaylistSummaryHeroProps {
  title: string;
  coverUrl: string | null;
  coverAlt: string;
  metaLine: string;
  actions?: ReactNode;
  className?: string;
}

export const PublicPlaylistSummaryHero = ({
  title,
  coverUrl,
  coverAlt,
  metaLine,
  actions,
  className,
}: PublicPlaylistSummaryHeroProps) => (
  <header
    className={classNames(styles.aside, className)}
    data-testid="fmdPublicPlaylistSummaryHero"
  >
    <div className={styles.coverFrame}>
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={coverAlt}
          width={256}
          height={256}
          className={styles.coverImage}
          sizes="(width >= 1024px) 256px, (width >= 768px) 144px, 100vw"
          priority
        />
      ) : (
        <div className={styles.coverPlaceholder} aria-hidden />
      )}
    </div>
    <div className={styles.copy}>
      <div className={styles.copyDetails}>
        <h1 className={styles.title}>{title}</h1>
        <p
          className={classNames(typographyStyles.metaCaption, styles.metaLine)}
        >
          {metaLine}
        </p>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  </header>
);
