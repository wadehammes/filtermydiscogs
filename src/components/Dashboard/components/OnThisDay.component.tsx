"use client";

import classNames from "classnames";
import Image from "next/image";
import { useMemo } from "react";
import { trackEvent } from "src/analytics/analytics";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getOnThisDayReleases } from "src/utils/onThisDay";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import timelineStyles from "./DashboardTimeline.module.css";
import styles from "./OnThisDay.module.css";

const ANALYTICS_CATEGORY = "onThisDay";

interface OnThisDayProps {
  hideHeading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

interface OnThisDayTimelineItemProps {
  release: DiscogsRelease;
  showYear: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

function OnThisDayTimelineItem({
  release,
  showYear,
  onReleaseClick,
}: OnThisDayTimelineItemProps) {
  const { title, artists, labels, thumb, cover_image, year, resource_url } =
    release.basic_information;
  const artistNames = artists.map((a) => a.name).join(", ");
  const primaryLabel = labels[0];
  const dateAdded = new Date(release.date_added);
  const yearAdded = dateAdded.getFullYear();
  const { openRelease, canOpen } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });
  const imageUrl = getReleaseImageUrl({
    thumb,
    cover_image,
    width: 400,
    height: 400,
    preferCoverImage: true,
  });
  const releaseUrl = getResourceUrl({
    resourceUrl: resource_url,
    type: "release",
  });
  const labelUrl = primaryLabel
    ? getResourceUrl({
        resourceUrl: primaryLabel.resource_url,
        type: "label",
      })
    : null;

  const handleReleaseOpen = () => {
    trackEvent("releaseClicked", {
      action: "releaseClicked",
      category: ANALYTICS_CATEGORY,
      label: "Release Clicked (onThisDay)",
      value: resource_url,
    });
    openRelease();
  };

  const imageActivateProps = canOpen
    ? getReleaseActivateProps({
        onActivate: handleReleaseOpen,
        ariaLabel: `Open release details for ${title}`,
      })
    : undefined;

  return (
    <li className={timelineStyles.item}>
      <div className={timelineStyles.marker}>
        {showYear ? (
          <time
            className={timelineStyles.markerTime}
            dateTime={dateAdded.toISOString()}
          >
            {yearAdded}
          </time>
        ) : (
          <span aria-hidden="true" className={timelineStyles.markerSpacer} />
        )}
        <span aria-hidden="true" className={timelineStyles.dot} />
      </div>
      <article
        className={classNames(timelineStyles.content, styles.timelineCard)}
      >
        <div className={styles.timelineCardInner}>
          <div
            className={styles.imageWrapper}
            {...definedProps(imageActivateProps ?? {})}
          >
            <Image
              src={imageUrl}
              alt={`${title} by ${artistNames}`}
              className={styles.coverImage}
              width={400}
              height={400}
              quality={85}
              loading="lazy"
              sizes="(max-width: 640px) 80px, 96px"
            />
          </div>
          <div className={styles.releaseInfo}>
            <div className={styles.releaseTitle}>
              {canOpen ? (
                <button
                  type="button"
                  className={styles.releaseTitleButton}
                  onClick={handleReleaseOpen}
                >
                  {title}
                </button>
              ) : releaseUrl ? (
                <a
                  href={releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent("releaseClicked", {
                      action: "releaseClicked",
                      category: ANALYTICS_CATEGORY,
                      label: "Release Clicked (onThisDay)",
                      value: resource_url,
                    });
                  }}
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </div>
            <div className={styles.releaseArtist}>
              {artists.map((artist, artistIndex) => {
                const artistUrl = getResourceUrl({
                  resourceUrl: artist.resource_url,
                  type: "artist",
                });

                return (
                  <span key={`${artist.id ?? artist.name}-${artistIndex}`}>
                    {artistUrl ? (
                      <a
                        href={artistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          trackEvent("artistClicked", {
                            action: "artistClicked",
                            category: ANALYTICS_CATEGORY,
                            label: "Artist Clicked (onThisDay)",
                            value: artist.resource_url || "",
                          });
                        }}
                      >
                        {artist.name}
                      </a>
                    ) : (
                      artist.name
                    )}
                    {artistIndex < artists.length - 1 && ", "}
                  </span>
                );
              })}
            </div>
            <div className={styles.releaseMeta}>
              {primaryLabel && (
                <>
                  {labelUrl ? (
                    <a
                      href={labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.labelLink}
                      onClick={() => {
                        trackEvent("labelClicked", {
                          action: "labelClicked",
                          category: ANALYTICS_CATEGORY,
                          label: "Label Clicked (onThisDay)",
                          value: primaryLabel.resource_url || "",
                        });
                      }}
                    >
                      {primaryLabel.name}
                    </a>
                  ) : (
                    <span>{primaryLabel.name}</span>
                  )}
                  {year > 0 && (
                    <span className={styles.metaSeparator} aria-hidden>
                      ·
                    </span>
                  )}
                </>
              )}
              {year > 0 && <span className={styles.year}>{year}</span>}
              <time
                className={styles.dateAdded}
                dateTime={dateAdded.toISOString()}
              >
                {dateAdded.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

export function OnThisDay({
  hideHeading = false,
  onReleaseClick,
}: OnThisDayProps) {
  const releases = useAllReleases();

  const onThisDayReleases = useMemo(() => {
    return getOnThisDayReleases(releases || []);
  }, [releases]);

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  if (onThisDayReleases.length === 0) {
    if (hideHeading) {
      return null;
    }

    return (
      <div className={styles.container}>
        <h2>On this day</h2>
        <p className={styles.date}>{dateString}</p>
        <p className={styles.emptyInline}>
          No records added on this date in earlier years.
        </p>
      </div>
    );
  }

  const visibleReleases = onThisDayReleases.slice(0, 10);

  return (
    <div className={styles.container}>
      {!hideHeading && <h2>On this day</h2>}
      {!hideHeading && <p className={styles.date}>{dateString}</p>}
      <ol className={timelineStyles.timeline}>
        {visibleReleases.map((release, index) => {
          const yearAdded = new Date(release.date_added).getFullYear();
          const previousRelease = visibleReleases[index - 1];
          const previousYear = previousRelease
            ? new Date(previousRelease.date_added).getFullYear()
            : null;

          return (
            <OnThisDayTimelineItem
              key={release.instance_id}
              release={release}
              showYear={yearAdded !== previousYear}
              {...definedProps({ onReleaseClick })}
            />
          );
        })}
      </ol>
      {onThisDayReleases.length > 10 && (
        <p className={styles.moreText}>
          And {onThisDayReleases.length - 10} more...
        </p>
      )}
    </div>
  );
}
