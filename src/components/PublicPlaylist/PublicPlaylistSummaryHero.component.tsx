"use client";

import classNames from "classnames";
import Image from "next/image";
import type { ReactNode } from "react";
import { CoverArtMosaic } from "src/components/CoverArtMosaic/CoverArtMosaic.component";
import { PublicPlaylistSummarySecondaryMetaLines } from "src/components/PublicPlaylist/PublicPlaylistSummarySecondaryMetaLines.component";
import {
  PUBLIC_SHARE_HERO_COVER_IMAGE_QUALITY,
  PUBLIC_SHARE_HERO_SINGLE_COVER_IMAGE_SIZES,
} from "src/constants/publicShareHeroCoverImage";
import EyeIcon from "src/styles/icons/eye-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import typographyStyles from "src/styles/modules/typography.module.css";
import type { PublicPlaylistShareStats } from "src/types/playlist.types";
import {
  formatPublicPlaylistShareStatCount,
  listPublicPlaylistShareEngagementItems,
  publicPlaylistShareStatsHasVisibleCounts,
} from "src/utils/playlistShareStats";
import styles from "./PublicPlaylistSummaryHero.module.css";

export type PublicPlaylistSummaryHeroCoverLayout = "mosaic" | "single";

export interface PublicPlaylistSummaryHeroProps {
  title: string;
  coverThumbUrls: string[];
  coverLayout?: PublicPlaylistSummaryHeroCoverLayout;
  coverLabel: string;
  metaLine: ReactNode;
  secondaryMetaLines?: readonly string[];
  shareStats?: PublicPlaylistShareStats;
  publicDescription?: string | null;
  actions?: ReactNode;
  className?: string;
}

export const PublicPlaylistSummaryHero = ({
  title,
  coverThumbUrls,
  coverLayout = "mosaic",
  coverLabel,
  metaLine,
  secondaryMetaLines,
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
  const engagementItems =
    listPublicPlaylistShareEngagementItems(resolvedShareStats);

  const singleCoverUrl = coverThumbUrls[0]?.trim() ?? "";

  return (
    <header
      className={classNames(styles.aside, className)}
      data-testid="fmdPublicPlaylistSummaryHero"
    >
      <div className={styles.heroPrimary}>
        <div className={styles.coverFrame}>
          {coverLayout === "single" ? (
            singleCoverUrl ? (
              <div
                className={styles.singleCoverWrap}
                role="img"
                aria-label={coverLabel}
                data-testid="fmdPublicShareHeroSingleCover"
              >
                <Image
                  src={singleCoverUrl}
                  alt=""
                  fill
                  className={styles.singleCoverImage}
                  sizes={PUBLIC_SHARE_HERO_SINGLE_COVER_IMAGE_SIZES}
                  quality={PUBLIC_SHARE_HERO_COVER_IMAGE_QUALITY}
                  priority
                />
              </div>
            ) : (
              <div className={styles.coverPlaceholder} aria-hidden />
            )
          ) : coverThumbUrls.length > 0 ? (
            <CoverArtMosaic
              thumbUrls={coverThumbUrls}
              aria-label={coverLabel}
            />
          ) : (
            <div className={styles.coverPlaceholder} aria-hidden />
          )}
        </div>
        <div className={styles.copyDetails}>
          <h1 className={styles.title}>{title}</h1>
          <div
            className={classNames(
              typographyStyles.metaCaption,
              styles.metaLine,
            )}
          >
            {metaLine}
          </div>
          {secondaryMetaLines && secondaryMetaLines.length > 0 ? (
            <PublicPlaylistSummarySecondaryMetaLines
              lines={secondaryMetaLines}
            />
          ) : null}
          {showShareStats ? (
            <div
              className={classNames(
                typographyStyles.metaCaption,
                styles.engagementMetaLine,
              )}
            >
              {engagementItems.map((item) => (
                <span
                  key={item.kind}
                  className={styles.engagementItem}
                  role="img"
                  aria-label={item.ariaLabel}
                >
                  {item.kind === "view" ? (
                    <EyeIcon className={styles.engagementIcon} aria-hidden />
                  ) : (
                    <PlayIcon className={styles.engagementIcon} aria-hidden />
                  )}
                  <span aria-hidden>
                    {formatPublicPlaylistShareStatCount(item.count)}
                  </span>
                </span>
              ))}
            </div>
          ) : null}
          {trimmedDescription ? (
            <p className={styles.publicDescription}>{trimmedDescription}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
};
