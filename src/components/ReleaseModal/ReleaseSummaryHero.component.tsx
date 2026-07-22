import classNames from "classnames";
import Image from "next/image";
import { trackEvent } from "src/analytics/analytics";
import ExternalLinkIcon from "src/styles/icons/external-link-solid.svg";
import StarIcon from "src/styles/icons/star-solid.svg";
import typographyStyles from "src/styles/typography.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";
import styles from "./ReleaseSummaryHero.module.css";

interface ReleaseSummaryHeroProps {
  release: DiscogsRelease;
  titleId?: string;
}

export const ReleaseSummaryHero = ({
  release,
  titleId,
}: ReleaseSummaryHeroProps) => {
  const { basic_information: basicInfo } = release;
  const artistNames = formatArtistNames(release);
  const metaLine = formatReleaseMetaLine({ release, includeCatno: false });
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
    <div className={styles.hero} data-testid="fmdReleaseSummaryHero">
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
        <div className={styles.detailsHeader}>
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
            {metaLine ? (
              <p
                className={classNames(
                  typographyStyles.metaCaption,
                  styles.metaLine,
                )}
              >
                {metaLine}
              </p>
            ) : null}
          </div>
          {releaseUrl ? (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.discogsButton}
              aria-label="View on Discogs"
              title="View on Discogs"
              onClick={() => {
                trackEvent("releaseClicked", {
                  action: "releaseClicked",
                  category: "releaseModal",
                  label: "View on Discogs",
                  value: releaseUrl,
                });
              }}
            >
              <ExternalLinkIcon className={styles.discogsIcon} />
            </a>
          ) : null}
        </div>
        {release.rating > 0 ? (
          <div
            className={styles.ratingBadge}
            title={`Rating: ${release.rating}/5`}
          >
            <StarIcon className={styles.starIcon} />
            {release.rating}
          </div>
        ) : null}
      </div>
    </div>
  );
};
