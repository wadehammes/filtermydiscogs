"use client";

import classNames from "classnames";
import Image from "next/image";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import { useAuth } from "src/context/auth.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import typographyStyles from "src/styles/typography.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
  getCommunityRatingFromReleaseDetail,
} from "src/utils/releaseDisplay";
import { parseReleaseId } from "src/utils/releaseNotes";
import { ReleaseHeroRatingsRow } from "./ReleaseHeroRatingsRow.component";
import styles from "./ReleaseSummaryHero.module.css";
import { ReleaseSummaryHeroToolbar } from "./ReleaseSummaryHeroToolbar.component";

interface ReleaseSummaryHeroProps {
  release: DiscogsRelease;
  titleId?: string;
  onClose?: () => void;
  showToolbar?: boolean;
}

export const ReleaseSummaryHero = ({
  release,
  titleId,
  onClose,
  showToolbar = true,
}: ReleaseSummaryHeroProps) => {
  const { state: authState } = useAuth();
  const selectedStyles = useSelectedStyles();
  const selectedFormats = useSelectedFormats();
  const handlePillClick = usePillClickHandler({ category: "releaseModal" });

  const { basic_information: basicInfo } = release;
  const { formats: releaseFormats, styles: releaseStyles } = basicInfo;
  const formatTags =
    releaseFormats && releaseFormats.length > 0
      ? getReleaseFormatTags(releaseFormats)
      : [];
  const artistNames = formatArtistNames(release);
  const releaseId = parseReleaseId(release);
  const showPersonalRating = authState.isAuthenticated && releaseId !== null;
  const { data: releaseDetail } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: releaseId !== null,
  });
  const communityRating = getCommunityRatingFromReleaseDetail(releaseDetail);
  const catalogMetaLine = formatReleaseMetaLine({ release });
  const showCatalogMetaLine = catalogMetaLine.length > 0;
  const showRatingsRow = showPersonalRating || communityRating !== null;
  const thumbUrl = getReleaseImageUrl({
    thumb: basicInfo.thumb,
    cover_image: basicInfo.cover_image,
    width: 200,
    height: 200,
    preferCoverImage: true,
  });

  return (
    <div className={styles.hero} data-testid="fmdReleaseSummaryHero">
      {showToolbar ? (
        <ReleaseSummaryHeroToolbar
          release={release}
          {...definedProps({ onClose })}
        />
      ) : null}
      <div
        className={classNames(styles.heroMain, {
          [styles.heroMainFlushTop]: !showToolbar,
        })}
      >
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
            {showCatalogMetaLine ? (
              <p
                className={classNames(
                  typographyStyles.metaCaption,
                  styles.metaLine,
                )}
              >
                {catalogMetaLine}
              </p>
            ) : null}
            {showRatingsRow ? (
              <ReleaseHeroRatingsRow
                communityRating={communityRating}
                release={release}
                showPersonalRating={showPersonalRating}
              />
            ) : null}
            {formatTags.length > 0 || (releaseStyles?.length ?? 0) > 0 ? (
              <HorizontalScrollRow className={styles.tagsRow}>
                {formatTags.map((formatName) => (
                  <button
                    key={formatName}
                    type="button"
                    className={classNames("pill", "pillFormat", {
                      pillSelected: selectedFormats.includes(formatName),
                    })}
                    onClick={(e) =>
                      handlePillClick({
                        event: e,
                        value: formatName,
                        type: "format",
                        eventLabel: "Format Pill Clicked",
                      })
                    }
                    aria-label={`Filter by ${formatName} format`}
                  >
                    {formatName}
                  </button>
                ))}
                {releaseStyles?.map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={classNames("pill", "pillStyle", {
                      pillSelected: selectedStyles.includes(style),
                    })}
                    onClick={(e) =>
                      handlePillClick({
                        event: e,
                        value: style,
                        type: "style",
                        eventLabel: "Style Pill Clicked",
                      })
                    }
                    aria-label={`Filter by ${style} style`}
                  >
                    {style}
                  </button>
                ))}
              </HorizontalScrollRow>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
