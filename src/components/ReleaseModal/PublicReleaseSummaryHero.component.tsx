"use client";

import classNames from "classnames";
import Image from "next/image";
import { trackEvent } from "src/analytics/analytics";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import {
  ModalToolbar,
  ModalToolbarLink,
} from "src/components/shared/ModalToolbar/ModalToolbar.component";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import typographyStyles from "src/styles/typography.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
  getCommunityRatingFromReleaseDetail,
} from "src/utils/releaseDisplay";
import { parseReleaseId } from "src/utils/releaseNotes";
import { ReleaseHeroRatingsRow } from "./ReleaseHeroRatingsRow.component";
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
  const catalogMetaLine = formatReleaseMetaLine({ release });
  const showCatalogMetaLine = catalogMetaLine.length > 0;
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
      <ModalToolbar {...definedProps({ onClose })}>
        {releaseUrl ? (
          <ModalToolbarLink
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
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
            <ExternalLinkIcon className={styles.actionIcon} aria-hidden />
          </ModalToolbarLink>
        ) : null}
      </ModalToolbar>
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
            {communityRating ? (
              <ReleaseHeroRatingsRow communityRating={communityRating} />
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
