import classNames from "classnames";
import Image from "next/image";
import { memo } from "react";
import { trackEvent } from "src/analytics/analytics";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import ExternalLinkIcon from "src/styles/icons/external-link-solid.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import type { ReleaseCardProps } from "src/types";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./ReleaseCard.module.css";
import {
  ReleaseCardCatalog,
  ReleaseCardMeta,
} from "./ReleaseCardMeta.component";
import { ReleaseCardTitle } from "./ReleaseCardTitle.component";

const PublicReleaseCardComponent = ({
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

  const catno = labels[0]?.catno ? String(labels[0].catno) : null;

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
        [styles.highlighted]: isHighlighted,
      })}
    >
      <div className={styles.imageShell}>
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
              style={{
                position: "relative",
                zIndex: 2,
                filter: "none",
              }}
              sizes="(max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
        <div className={styles.actionButtonsContainer}>
          {releaseUrl ? (
            <div
              className={classNames(
                segmentedStyles.container,
                segmentedStyles.containerAllowOverflow,
                styles.actionSegmented,
              )}
            >
              <div className={styles.segmentSlot}>
                <a
                  href={releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classNames(
                    segmentedStyles.segment,
                    styles.actionSegment,
                  )}
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
                  <ExternalLinkIcon className={styles.actionIcon} />
                </a>
                <span className={styles.tooltip}>View on Discogs</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.mainContent}>
          <ReleaseCardCatalog catno={catno} />
          <ReleaseCardTitle
            artists={artists}
            title={title}
            releaseUrl={releaseUrl}
            resourceUrl={resource_url}
            analyticsCategory="publicCrate"
          />
          <ReleaseCardMeta
            labelName={labels[0]?.name}
            labelUrl={labelUrl}
            year={year}
            analyticsCategory="publicCrate"
          />
        </div>
        <HorizontalScrollRow className={styles.genresContainer}>
          {releaseFormats &&
            releaseFormats.length > 0 &&
            getReleaseFormatTags(releaseFormats).map((formatName) => (
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
        </HorizontalScrollRow>
      </div>
    </div>
  ) : null;
};

export const PublicReleaseCard = memo(PublicReleaseCardComponent);
