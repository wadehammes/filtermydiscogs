import classNames from "classnames";
import { memo } from "react";
import { HorizontalScrollRow } from "src/components/HorizontalScrollRow/HorizontalScrollRow.component";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import type { ReleaseCardProps } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import styles from "./ReleaseCard.module.css";
import { ReleaseCardImage } from "./ReleaseCardImage.component";
import {
  ReleaseCardCatalog,
  ReleaseCardMeta,
} from "./ReleaseCardMeta.component";
import { ReleaseCardTitle } from "./ReleaseCardTitle.component";

const PublicReleaseCardComponent = ({
  release,
  isHighlighted = false,
  onReleaseClick,
}: Omit<ReleaseCardProps, "isRandomMode" | "onExitRandomMode">) => {
  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseCardOpenHandler({
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

  return release ? (
    <div
      className={classNames(styles.releaseCard, {
        [styles.highlighted]: isHighlighted,
      })}
      data-testid="fmdPublicReleaseCard"
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <ReleaseCardImage
        release={release}
        thumbUrl={thumbUrl}
        {...definedProps({
          onReleaseOpen: canOpen ? openRelease : undefined,
          onReleasePrefetch: canOpen ? prefetchReleaseOpen : undefined,
        })}
      />
      <div className={styles.contentContainer}>
        <div className={styles.mainContent}>
          <ReleaseCardCatalog catno={catno} />
          <div className={styles.headerTextStack}>
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
