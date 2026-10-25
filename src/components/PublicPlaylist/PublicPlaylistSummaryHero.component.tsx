"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { CoverArtMosaic } from "src/components/CoverArtMosaic/CoverArtMosaic.component";
import typographyStyles from "src/styles/modules/typography.module.css";
import styles from "./PublicPlaylistSummaryHero.module.css";

export interface PublicPlaylistSummaryHeroProps {
  title: string;
  coverThumbUrls: string[];
  coverLabel: string;
  metaLine: string;
  actions?: ReactNode;
  className?: string;
}

export const PublicPlaylistSummaryHero = ({
  title,
  coverThumbUrls,
  coverLabel,
  metaLine,
  actions,
  className,
}: PublicPlaylistSummaryHeroProps) => (
  <header
    className={classNames(styles.aside, className)}
    data-testid="fmdPublicPlaylistSummaryHero"
  >
    <div className={styles.coverFrame}>
      {coverThumbUrls.length > 0 ? (
        <CoverArtMosaic
          thumbUrls={coverThumbUrls}
          layout="fill"
          aria-label={coverLabel}
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
