"use client";

import classNames from "classnames";
import Image from "next/image";
import textActionStyles from "src/styles/modules/text-action.module.css";
import type { TopUserTrack } from "src/types/dashboard.types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl } from "src/utils/helpers";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import { formatTopUserTrackHeadLabel } from "src/utils/userTrack";
import styles from "./DashboardTrackItem.module.css";

const COVER_SIZE = 48;

const resolveTrackCoverUrl = (
  coverUrl: string | undefined,
  releaseThumb: string | null,
): string => {
  if (coverUrl) {
    return coverUrl;
  }

  if (releaseThumb) {
    return releaseThumb;
  }

  return getReleaseImageUrl({
    width: COVER_SIZE,
    height: COVER_SIZE,
  });
};

interface DashboardTrackItemProps {
  track: TopUserTrack;
  metric: "play" | "listen";
  coverUrl?: string;
  catalogTrackTitle?: string;
  onReleaseClick?: (instanceId: string) => void;
}

export function DashboardTrackItem({
  track,
  metric,
  coverUrl,
  catalogTrackTitle,
  onReleaseClick,
}: DashboardTrackItemProps) {
  const count = metric === "play" ? track.play_count : track.listen_count;
  const countLabel = metric === "play" ? "plays" : "listens";
  const canOpen = onReleaseClick !== undefined;
  const title = formatTopUserTrackHeadLabel({
    track_position: track.track_position,
    track_title: track.track_title,
    ...definedProps({ catalogTrackTitle }),
  });
  const subtitleParts = [
    track.artist?.trim(),
    track.release_title?.trim(),
  ].filter((part): part is string => Boolean(part));
  const subtitle = subtitleParts.join(" · ");
  const releaseLabel = track.release_title?.trim() || "release";

  const openRelease = () => {
    onReleaseClick?.(track.instance_id);
  };

  const coverActivateProps = canOpen
    ? getReleaseActivateProps({
        onActivate: openRelease,
        ariaLabel: `Open release details for ${releaseLabel}`,
      })
    : undefined;

  const displayCoverUrl = resolveTrackCoverUrl(coverUrl, track.release_thumb);

  return (
    <div className={styles.trackItem} data-testid="fmdDashboardTrackItem">
      <div
        className={styles.imageWrapper}
        {...definedProps(coverActivateProps ?? {})}
      >
        <Image
          src={displayCoverUrl}
          alt=""
          className={styles.coverImage}
          width={COVER_SIZE}
          height={COVER_SIZE}
          quality={85}
          loading="lazy"
          sizes="48px"
        />
      </div>
      <div className={styles.trackInfo}>
        <div className={styles.trackTitleRow}>
          {canOpen ? (
            <button
              type="button"
              className={classNames(
                textActionStyles.inheritlink,
                styles.trackTitleButton,
              )}
              onClick={openRelease}
            >
              {title}
            </button>
          ) : (
            <span className={styles.trackTitle}>{title}</span>
          )}
        </div>
        {subtitle ? <p className={styles.trackMeta}>{subtitle}</p> : null}
      </div>
      <div className={styles.metric}>
        <span className={styles.metricNumber}>{count}</span>
        <span className={styles.metricLabel}>{countLabel}</span>
      </div>
    </div>
  );
}
