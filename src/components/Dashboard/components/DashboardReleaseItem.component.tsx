"use client";

import Image from "next/image";
import { trackEvent } from "src/analytics/analytics";
import type { DiscogsRelease } from "src/types";
import { getResourceUrl } from "src/utils/helpers";
import styles from "./DashboardReleaseItem.module.css";

interface DashboardReleaseItemProps {
  release: DiscogsRelease;
  category: string;
  children?: React.ReactNode;
}

export function DashboardReleaseItem({
  release,
  category,
  children,
}: DashboardReleaseItemProps) {
  const { title, artists, labels, thumb, year, resource_url } =
    release.basic_information;
  const releaseUrl = getResourceUrl({
    resourceUrl: resource_url,
    type: "release",
  });
  const primaryLabel = labels[0];
  const artistNames = artists.map((a) => a.name).join(", ");

  return (
    <div className={styles.releaseItemContainer}>
      {thumb && (
        <div className={styles.imageWrapper}>
          <Image
            src={thumb}
            alt={`${title} by ${artistNames}`}
            className={styles.coverImage}
            width={48}
            height={48}
            quality={85}
            loading="lazy"
            sizes="48px"
          />
        </div>
      )}
      <div className={styles.releaseInfo}>
        <div className={styles.releaseTitle}>
          {artists.map((artist, index) => {
            const artistUrl = getResourceUrl({
              resourceUrl: artist.resource_url,
              type: "artist",
            });
            return (
              <span key={artist.id || index}>
                {artistUrl ? (
                  <a
                    href={artistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent("artistClicked", {
                        action: "artistClicked",
                        category,
                        label: `Artist Clicked (${category})`,
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
          })}{" "}
          -{" "}
          {releaseUrl ? (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("releaseClicked", {
                  action: "releaseClicked",
                  category,
                  label: `Release Clicked (${category})`,
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
        {(primaryLabel || year > 0) && (
          <div className={styles.releaseMeta}>
            {primaryLabel && (
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
                      onClick={() => {
                        trackEvent("labelClicked", {
                          action: "labelClicked",
                          category,
                          label: `Label Clicked (${category})`,
                          value: primaryLabel.resource_url || "",
                        });
                      }}
                    >
                      {primaryLabel.name}
                    </a>
                  );
                })()}
                {year > 0 && " • "}
              </>
            )}
            {year > 0 && year}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
