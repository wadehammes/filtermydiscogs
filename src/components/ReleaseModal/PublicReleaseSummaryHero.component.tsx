"use client";

import classNames from "classnames";
import Image from "next/image";
import { trackEvent } from "src/analytics/analytics";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import StarIcon from "src/styles/icons/star-thin.svg";
import XIcon from "src/styles/icons/x-thin.svg";
import typographyStyles from "src/styles/typography.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatCommunityRatingAverage,
  formatReleaseHeroMetaLine,
  getCommunityRatingFromReleaseDetail,
} from "src/utils/releaseDisplay";
import { parseReleaseId } from "src/utils/releaseNotes";
import styles from "./ReleaseSummaryHero.module.css";

interface PublicReleaseSummaryHeroProps {
  release: DiscogsRelease;
  titleId?: string;
  onClose?: () => void;
}

export const PublicReleaseSummaryHero = ({
  release,
  titleId,
  onClose,
}: PublicReleaseSummaryHeroProps) => {
  const { basic_information: basicInfo } = release;
  const { formats: releaseFormats, styles: releaseStyles } = basicInfo;
  const formatTags =
    releaseFormats && releaseFormats.length > 0
      ? getReleaseFormatTags(releaseFormats)
      : [];
  const artistNames = formatArtistNames(release);
  const releaseId = parseReleaseId(release);
  const { data: releaseDetail } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: releaseId !== null,
  });
  const communityRating = getCommunityRatingFromReleaseDetail(releaseDetail);
  const heroMetaLine = formatReleaseHeroMetaLine({
    release,
    communityRating,
  });
  const showHeroMetaLine =
    heroMetaLine.text.length > 0 || heroMetaLine.communityRating !== null;
  const releaseUrl = getResourceUrl({
    resourceUrl: basicInfo.resource_url,
    type: "release",
  });
  const thumbUrl = getReleaseImageUrl({
    thumb: basicInfo.thumb,
    cover_image: basicInfo.cover_image,
    width: 200,
    height: 200,
    preferCoverImage: true,
  });

  return (
    <div className={styles.hero} data-testid="fmdPublicReleaseSummaryHero">
      <div className={styles.heroToolbar}>
        <div className={styles.toolbarActions}>
          {releaseUrl ? (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classNames(styles.actionButton, styles.discogsButton)}
              aria-label="View on Discogs"
              title="View on Discogs"
              onClick={() => {
                trackEvent("releaseClicked", {
                  action: "releaseClicked",
                  category: "publicReleaseModal",
                  label: "View on Discogs",
                  value: releaseUrl,
                });
              }}
            >
              <ExternalLinkIcon className={styles.actionIcon} />
            </a>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            className={classNames(styles.actionButton, styles.closeButton)}
            onClick={onClose}
            aria-label="Close modal"
          >
            <XIcon className={styles.actionIcon} />
          </button>
        ) : null}
      </div>
      <div className={styles.heroMain}>
        <div className={styles.coverWrapper}>
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={basicInfo.title}
              width={96}
              height={96}
              className={styles.cover}
              sizes="96px"
            />
          ) : null}
        </div>
        <div className={styles.details}>
          <div className={styles.detailsText}>
            <p
              className={classNames(
                typographyStyles.metaCaption,
                styles.artist,
              )}
            >
              {artistNames}
            </p>
            <h2 className={styles.title} {...definedProps({ id: titleId })}>
              {basicInfo.title}
            </h2>
            {showHeroMetaLine ? (
              <p
                className={classNames(
                  typographyStyles.metaCaption,
                  styles.metaLine,
                )}
              >
                {heroMetaLine.text ? <span>{heroMetaLine.text}</span> : null}
                {heroMetaLine.text && heroMetaLine.communityRating
                  ? " · "
                  : null}
                {heroMetaLine.communityRating ? (
                  <span className={styles.communityRating}>
                    <StarIcon
                      className={styles.communityStarIcon}
                      aria-hidden
                    />
                    {formatCommunityRatingAverage(
                      heroMetaLine.communityRating.average,
                    )}{" "}
                    ({heroMetaLine.communityRating.count})
                  </span>
                ) : null}
              </p>
            ) : null}
            {formatTags.length > 0 || (releaseStyles?.length ?? 0) > 0 ? (
              <HorizontalScrollRow className={styles.tagsRow}>
                {formatTags.map((formatName) => (
                  <span
                    key={formatName}
                    className={classNames(
                      "pill",
                      "pillFormat",
                      styles.staticPill,
                    )}
                  >
                    {formatName}
                  </span>
                ))}
                {releaseStyles?.map((style) => (
                  <span
                    key={style}
                    className={classNames(
                      "pill",
                      "pillStyle",
                      styles.staticPill,
                    )}
                  >
                    {style}
                  </span>
                ))}
              </HorizontalScrollRow>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
