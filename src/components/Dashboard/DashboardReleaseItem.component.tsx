"use client";

import classNames from "classnames";
import Image from "next/image";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getResourceUrl } from "src/utils/helpers";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import styles from "./DashboardReleaseItem.module.css";

interface DashboardReleaseItemProps {
  release: DiscogsRelease;
  wrapText?: boolean;
  children?: React.ReactNode;
  onReleaseClick?: (instanceId: string) => void;
}

export function DashboardReleaseItem({
  release,
  wrapText = false,
  children,
  onReleaseClick,
}: DashboardReleaseItemProps) {
  const { title, artists, labels, thumb, year, resource_url } =
    release.basic_information;
  const releaseUrl = getResourceUrl({
    resourceUrl: resource_url,
    type: "release",
  });
  const primaryLabel = labels[0];
  const artistNames = artists.map((a) => a.name).join(", ");
  const { openRelease, canOpen } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });

  const imageActivateProps = canOpen
    ? getReleaseActivateProps({
        onActivate: () => {
          openRelease();
        },
        ariaLabel: `Open release details for ${title}`,
      })
    : undefined;

  const handleTitleOpen = () => {
    openRelease();
  };

  return (
    <div
      className={classNames(styles.releaseItemContainer, {
        [styles.releaseItemWrap]: wrapText,
      })}
    >
      {thumb && (
        <div
          className={styles.imageWrapper}
          {...definedProps(imageActivateProps ?? {})}
        >
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
              <span key={`${artist.id ?? artist.name}-${index}`}>
                {artistUrl ? (
                  <a
                    href={artistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
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
          })}{" "}
          -{" "}
          {canOpen ? (
            <button
              type="button"
              className={styles.releaseTitleButton}
              onClick={handleTitleOpen}
            >
              {title}
            </button>
          ) : releaseUrl ? (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {}}
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
                      onClick={() => {}}
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
