"use client";

import classNames from "classnames";
import Image from "next/image";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import textActionStyles from "src/styles/modules/text-action.module.css";
import type { DiscogsRelease } from "src/types";
import type { TopUserTrack } from "src/types/dashboard.types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import { formatTopUserTrackHeadLabel } from "src/utils/userTrack";
import releaseItemStyles from "./DashboardReleaseItem.module.css";
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
  release?: DiscogsRelease;
  coverUrl?: string;
  catalogTrackTitle?: string;
  onReleaseClick?: (instanceId: string) => void;
}

export function DashboardTrackItem({
  track,
  metric,
  release,
  coverUrl,
  catalogTrackTitle,
  onReleaseClick,
}: DashboardTrackItemProps) {
  const count = metric === "play" ? track.play_count : track.listen_count;
  const countLabel = metric === "play" ? "plays" : "listens";
  const trackHead = formatTopUserTrackHeadLabel({
    track_position: track.track_position,
    track_title: track.track_title,
    ...definedProps({ catalogTrackTitle }),
  });

  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseCardOpenHandler({
      release,
      onReleaseClick,
    });

  const albumTitle =
    release?.basic_information.title?.trim() ??
    track.release_title?.trim() ??
    "";
  const artists = release?.basic_information.artists;
  const artistNames =
    artists?.map((artist) => artist.name).join(", ") ??
    track.artist?.trim() ??
    "";
  const primaryLabel = release?.basic_information.labels[0];
  const year = release?.basic_information.year ?? 0;

  const coverActivateProps = canOpen
    ? getReleaseActivateProps({
        onActivate: openRelease,
        ariaLabel: `Open release details for ${albumTitle || trackHead}`,
        onFocus: prefetchReleaseOpen,
      })
    : undefined;

  const displayCoverUrl = resolveTrackCoverUrl(coverUrl, track.release_thumb);

  const artistMeta =
    artists && artists.length > 0 ? (
      <>
        {artists.map((artist, index) => {
          const artistUrl = getResourceUrl({
            resourceUrl: artist.resource_url,
            type: "artist",
          });
          return (
            <span key={`${artist.id ?? artist.name}-${index}`}>
              {artistUrl ? (
                <a
                  href={artistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={textActionStyles.inheritlink}
                  onClick={() => {}}
                >
                  {artist.name}
                </a>
              ) : (
                artist.name
              )}
              {index < artists.length - 1 && ", "}
            </span>
          );
        })}
      </>
    ) : track.artist?.trim() ? (
      track.artist.trim()
    ) : null;

  const hasLabelOrYear = Boolean(primaryLabel) || year > 0;
  const hasFallbackAlbumMeta =
    !release && Boolean(albumTitle) && !hasLabelOrYear && !artistMeta;

  return (
    <div
      className={classNames(
        releaseItemStyles.releaseItemContainer,
        styles.trackItem,
      )}
      data-testid="fmdDashboardTrackItem"
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <div
        className={releaseItemStyles.imageWrapper}
        {...definedProps(coverActivateProps ?? {})}
      >
        <Image
          src={displayCoverUrl}
          alt={
            artistNames
              ? `${trackHead} from ${albumTitle || "release"} by ${artistNames}`
              : trackHead
          }
          className={releaseItemStyles.coverImage}
          width={COVER_SIZE}
          height={COVER_SIZE}
          quality={85}
          loading="lazy"
          sizes="48px"
        />
      </div>
      <div className={releaseItemStyles.releaseInfo}>
        <div className={releaseItemStyles.releaseTitle}>
          {canOpen ? (
            <button
              type="button"
              className={classNames(
                textActionStyles.inheritlink,
                styles.trackHeadButton,
              )}
              onClick={openRelease}
            >
              {trackHead}
            </button>
          ) : (
            <span className={styles.trackHeadText}>{trackHead}</span>
          )}
        </div>
        {(artistMeta || hasLabelOrYear || hasFallbackAlbumMeta) && (
          <div className={releaseItemStyles.releaseMeta}>
            {artistMeta}
            {artistMeta && hasLabelOrYear ? " · " : null}
            {primaryLabel ? (
              <>
                {(() => {
                  const labelUrl = getResourceUrl({
                    resourceUrl: primaryLabel.resource_url,
                    type: "label",
                  });
                  if (!labelUrl) {
                    return primaryLabel.name;
                  }
                  return (
                    <a
                      href={labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={textActionStyles.inheritlink}
                      onClick={() => {}}
                    >
                      {primaryLabel.name}
                    </a>
                  );
                })()}
                {year > 0 && " • "}
              </>
            ) : null}
            {year > 0 ? year : null}
            {hasFallbackAlbumMeta ? albumTitle : null}
          </div>
        )}
      </div>
      <div className={styles.metric}>
        <span className={styles.metricNumber}>{count}</span>
        <span className={styles.metricLabel}>{countLabel}</span>
      </div>
    </div>
  );
}
