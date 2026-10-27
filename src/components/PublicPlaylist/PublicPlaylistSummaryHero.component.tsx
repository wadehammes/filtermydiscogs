"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { CoverArtMosaic } from "src/components/CoverArtMosaic/CoverArtMosaic.component";
import EyeIcon from "src/styles/icons/eye-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import typographyStyles from "src/styles/modules/typography.module.css";
import type { PublicPlaylistShareStats } from "src/types/playlist.types";
import {
  formatPublicPlaylistShareStatCountLabel,
  publicPlaylistShareStatsHasVisibleCounts,
} from "src/utils/playlistShareStats";
import styles from "./PublicPlaylistSummaryHero.module.css";

export interface PublicPlaylistSummaryHeroProps {
  title: string;
  coverThumbUrls: string[];
  coverLabel: string;
  metaLine: string;
  shareStats?: PublicPlaylistShareStats;
  publicDescription?: string | null;
  actions?: ReactNode;
  className?: string;
}

export const PublicPlaylistSummaryHero = ({
  title,
  coverThumbUrls,
  coverLabel,
  metaLine,
  shareStats,
  publicDescription,
  actions,
  className,
}: PublicPlaylistSummaryHeroProps) => {
  const trimmedDescription = publicDescription?.trim() ?? "";
  const resolvedShareStats = shareStats ?? {
    publicViewCount: 0,
    publicPlayCount: 0,
  };
  const showShareStats =
    publicPlaylistShareStatsHasVisibleCounts(resolvedShareStats);

  return (
    <header
      className={classNames(styles.aside, className)}
      data-testid="fmdPublicPlaylistSummaryHero"
    >
      <div className={styles.heroPrimary}>
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
        <div className={styles.copyDetails}>
          <h1 className={styles.title}>{title}</h1>
          <p
            className={classNames(
              typographyStyles.metaCaption,
              styles.metaLine,
            )}
          >
            {metaLine}
          </p>
          <div
            className={classNames(
              typographyStyles.metaCaption,
              styles.engagementMetaLine,
            )}
            {...(showShareStats ? {} : { "aria-hidden": true as const })}
          >
            {showShareStats ? (
              <>
                {resolvedShareStats.publicViewCount > 0 ? (
                  <span className={styles.engagementItem}>
                    <EyeIcon className={styles.engagementIcon} aria-hidden />
                    <span>
                      {formatPublicPlaylistShareStatCountLabel(
                        resolvedShareStats.publicViewCount,
                        "view",
                        "views",
                      )}
                    </span>
                  </span>
                ) : null}
                {resolvedShareStats.publicPlayCount > 0 ? (
                  <span className={styles.engagementItem}>
                    <PlayIcon className={styles.engagementIcon} aria-hidden />
                    <span>
                      {formatPublicPlaylistShareStatCountLabel(
                        resolvedShareStats.publicPlayCount,
                        "play",
                        "plays",
                      )}
                    </span>
                  </span>
                ) : null}
              </>
            ) : (
              "\u00a0"
            )}
          </div>
          {trimmedDescription ? (
            <p className={styles.publicDescription}>{trimmedDescription}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
};
