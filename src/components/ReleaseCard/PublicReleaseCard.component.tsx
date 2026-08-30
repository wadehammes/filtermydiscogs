import classNames from "classnames";
import Image from "next/image";
import { memo } from "react";
import { HorizontalScrollRow } from "src/components/HorizontalScrollRow/HorizontalScrollRow.component";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { ReleaseCardProps } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import styles from "./ReleaseCard.module.css";
import {
  ReleaseCardCatalog,
  ReleaseCardMeta,
} from "./ReleaseCardMeta.component";
import { ReleaseCardTitle } from "./ReleaseCardTitle.component";
import { releaseCardImageContainerStyle } from "./releaseCardImageContainerStyle";

const PublicReleaseCardComponent = ({
  release,
  isHighlighted = false,
  onReleaseClick,
}: Omit<ReleaseCardProps, "isRandomMode" | "onExitRandomMode">) => {
  const { openRelease, canOpen } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });
  const {
    labels,
    year,
    artists,
    title,
    thumb,
    cover_image,
    formats: releaseFormats,
    resource_url,
  } = release.basic_information;

  const catno = labels[0]?.catno ? String(labels[0].catno) : null;
  const genreStyleTags = getReleaseGenreStyleTags(release.basic_information);

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

  const activateProps = canOpen
    ? getReleaseActivateProps({
        onActivate: openRelease,
        ariaLabel: `Open release details for ${title}`,
      })
    : undefined;

  return release ? (
    <div
      className={classNames(styles.releaseCard, {
        [styles.highlighted]: isHighlighted,
      })}
      data-testid="fmdPublicReleaseCard"
    >
      <div className={styles.imageShell}>
        <div
          className={styles.imageContainer}
          style={releaseCardImageContainerStyle(thumbUrl)}
          {...definedProps(activateProps ?? {})}
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
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.mainContent}>
          <ReleaseCardCatalog catno={catno} />
          <ReleaseCardTitle
            artists={artists}
            title={title}
            releaseUrl={releaseUrl}
          />
          <ReleaseCardMeta
            labelName={labels[0]?.name}
            labelUrl={labelUrl}
            year={year}
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

          {genreStyleTags.map((tag) => (
            <span
              key={tag}
              className={classNames("pill", "pillStyle", styles.stylePill)}
            >
              {tag}
            </span>
          ))}
        </HorizontalScrollRow>
      </div>
    </div>
  ) : null;
};

export const PublicReleaseCard = memo(PublicReleaseCardComponent);
