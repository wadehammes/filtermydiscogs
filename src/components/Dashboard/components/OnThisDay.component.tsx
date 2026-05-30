"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useCollectionContext } from "src/context/collection.context";
import { getReleaseImageUrl } from "src/utils/helpers";
import { getOnThisDayReleases } from "src/utils/onThisDay";
import styles from "./OnThisDay.module.css";

export function OnThisDay() {
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;

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
          const { title, artists, thumb, cover_image, year } =
            release.basic_information;
          const artistNames = artists.map((a) => a.name).join(", ");
          const dateAdded = new Date(release.date_added);
          const yearAdded = dateAdded.getFullYear();
          const imageUrl = getReleaseImageUrl({
            thumb,
            cover_image,
            width: 400,
            height: 400,
            preferCoverImage: true,
          });

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
                <div className={styles.releaseTitle}>{title}</div>
                <div className={styles.releaseArtist}>{artistNames}</div>
                <div className={styles.releaseMeta}>
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
