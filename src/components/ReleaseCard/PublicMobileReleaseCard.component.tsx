import classNames from "classnames";
import Image from "next/image";
import { memo } from "react";
import { trackEvent } from "src/analytics/analytics";
import ExternalLinkIcon from "src/styles/icons/external-link-solid.svg";
import type { ReleaseCardProps } from "src/types";
import { formatDate } from "src/utils/dateHelpers";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./MobileReleaseCard.module.css";

const PublicMobileReleaseCardComponent = ({
  release,
  isHighlighted = false,
}: Omit<ReleaseCardProps, "isRandomMode" | "onExitRandomMode">) => {
  const {
    labels,
    year,
    artists,
    title,
    thumb,
    cover_image,
    styles: releaseStyles,
    formats: releaseFormats,
    resource_url,
  } = release.basic_information;

  const dateAdded = release.date_added ? formatDate(release.date_added) : null;
  const thumbUrl = getReleaseImageUrl({
    thumb,
    cover_image,
    width: 200,
    height: 200,
    preferCoverImage: true,
  });

  const releaseUrl = getResourceUrl({
    resourceUrl: resource_url,
    type: "release",
  });

  const labelUrl = getResourceUrl({
    resourceUrl: labels[0]?.resource_url,
    type: "label",
  });

  return release ? (
    <div
      className={classNames(styles.releaseCard, {
        [styles.highlighted as string]: isHighlighted,
      })}
    >
      <div
        className={styles.imageContainer}
        data-bg-image={thumbUrl || undefined}
        style={
          thumbUrl
            ? {
                backgroundImage: `url(${thumbUrl})`,
              }
            : undefined
        }
      >
        {thumbUrl && (
          <Image
            src={thumbUrl}
            height={200}
            width={200}
            quality={85}
            alt={release.basic_information.title}
            loading="lazy"
            className={styles.releaseImage}
            style={{
              position: "relative",
              zIndex: 2,
              filter: "none",
            }}
            sizes="100px"
          />
        )}
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.mainContent}>
          <h3 className={styles.title}>
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
                      title={`View ${artist.name} on Discogs`}
                      onClick={(e) => {
                        e.stopPropagation();
                        trackEvent("artistClicked", {
                          action: "artistClicked",
                          category: "publicCrate",
                          label: "Artist Clicked",
                          value: artistUrl,
                        });
                      }}
                      className={styles.artistLink}
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
                    category: "publicCrate",
                    label: "Release Clicked",
                    value: resource_url,
                  });
                }}
                className={styles.titleLink}
                title="View release on Discogs"
              >
                {title}
              </a>
            ) : (
              <span>{title}</span>
            )}
          </h3>
          <div className={styles.metaContainer}>
            {(labels[0]?.name || year !== 0) && (
              <p className={styles.meta}>
                {labelUrl ? (
                  <a
                    href={labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View ${labels[0]?.name} on Discogs`}
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent("labelClicked", {
                        action: "labelClicked",
                        category: "publicCrate",
                        label: "Label Clicked",
                        value: labelUrl,
                      });
                    }}
                    className={styles.labelLink}
                  >
                    {labels[0]?.name}
                  </a>
                ) : (
                  labels[0]?.name
                )}
                {(() => {
                  const catno = labels[0]?.catno;
                  const catnoStr = catno ? String(catno) : "";
                  return (
                    <>
                      {labels[0]?.name && catnoStr ? " • " : ""}
                      {catnoStr}
                      {(labels[0]?.name || catnoStr) && year !== 0 ? " • " : ""}
                    </>
                  );
                })()}
                {year !== 0 ? year : ""}
              </p>
            )}
            {dateAdded && (
              <p className={styles.meta}>Date Added: {dateAdded}</p>
            )}
          </div>
        </div>
        <div className={styles.genresContainer}>
          {releaseFormats &&
            releaseFormats.length > 0 &&
            Array.from(
              new Set(releaseFormats.map((format) => format.name)),
            ).map((formatName) => (
              <span
                key={formatName}
                className={classNames("pill", "pillFormat", styles.formatPill)}
              >
                {formatName}
              </span>
            ))}

          {releaseStyles &&
            releaseStyles.length > 0 &&
            releaseStyles.map((style: string) => (
              <span
                key={style}
                className={classNames("pill", "pillStyle", styles.stylePill)}
              >
                {style}
              </span>
            ))}
        </div>
      </div>
      <div className={styles.actionButtonsContainer}>
        {releaseUrl && (
          <a
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.discogsButton}
            onClick={() => {
              trackEvent("releaseClicked", {
                action: "releaseClicked",
                category: "publicCrate",
                label: "Release Clicked",
                value: resource_url,
              });
            }}
            aria-label="View on Discogs"
            title="View on Discogs"
          >
            <ExternalLinkIcon className={styles.externalLinkIcon} />
          </a>
        )}
      </div>
    </div>
  ) : null;
};

export const PublicMobileReleaseCard = memo(PublicMobileReleaseCardComponent);
export default PublicMobileReleaseCard;
