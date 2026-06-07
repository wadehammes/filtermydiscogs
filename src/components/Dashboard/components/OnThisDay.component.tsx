"use client";

import Image from "next/image";
import { useMemo } from "react";
import { trackEvent } from "src/analytics/analytics";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getOnThisDayReleases } from "src/utils/onThisDay";
import styles from "./OnThisDay.module.css";

const ANALYTICS_CATEGORY = "onThisDay";

export function OnThisDay() {
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
    return (
      <div className={styles.container}>
        <h2>On this day</h2>
        <p className={styles.date}>{dateString}</p>
        <div className={styles.emptyState}>
          <p>No releases were added on this date in previous years.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>On this day</h2>
      <p className={styles.date}>{dateString}</p>
      <div className={styles.releasesGrid}>
        {onThisDayReleases.slice(0, 10).map((release) => {
          const {
            title,
            artists,
            labels,
            thumb,
            cover_image,
            year,
            resource_url,
          } = release.basic_information;
          const artistNames = artists.map((a) => a.name).join(", ");
          const primaryLabel = labels[0];
          const dateAdded = new Date(release.date_added);
          const yearAdded = dateAdded.getFullYear();
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

          return (
            <div key={release.instance_id} className={styles.releaseCard}>
              <div className={styles.imageWrapper}>
                <Image
                  src={imageUrl}
                  alt={`${title} by ${artistNames}`}
                  className={styles.coverImage}
                  width={400}
                  height={400}
                  quality={85}
                  loading="lazy"
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 192px, 224px"
                />
              </div>
              <div className={styles.releaseInfo}>
                <div className={styles.releaseTitle}>
                  {releaseUrl ? (
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
                        {index < artists.length - 1 && ", "}
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
                  <span className={styles.yearAdded}>Added in {yearAdded}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {onThisDayReleases.length > 10 && (
        <p className={styles.moreText}>
          And {onThisDayReleases.length - 10} more...
        </p>
      )}
    </div>
  );
}
