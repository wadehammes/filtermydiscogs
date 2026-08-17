"use client";

import classNames from "classnames";
import StarIcon from "src/styles/icons/star-thin.svg";
import typographyStyles from "src/styles/typography.module.css";
import type { DiscogsRelease } from "src/types";
import { formatCommunityRatingAverage } from "src/utils/releaseDisplay";
import { ReleasePersonalRating } from "./ReleasePersonalRating.component";
import styles from "./ReleaseSummaryHero.module.css";

interface ReleaseHeroRatingsRowProps {
  communityRating: { average: number; count: number } | null;
  release?: DiscogsRelease;
  showPersonalRating?: boolean;
}

export const ReleaseHeroRatingsRow = ({
  communityRating,
  release,
  showPersonalRating = false,
}: ReleaseHeroRatingsRowProps) => {
  const showPersonal = showPersonalRating && release !== undefined;

  if (!(showPersonal || communityRating)) {
    return null;
  }

  return (
    <div
      className={classNames(typographyStyles.metaCaption, styles.ratingsRow)}
      data-testid="fmdReleaseHeroRatings"
    >
      {showPersonal ? <ReleasePersonalRating release={release} /> : null}
      {showPersonal && communityRating ? (
        <span className={styles.ratingsSeparator} aria-hidden>
          ·
        </span>
      ) : null}
      {communityRating ? (
        <span
          className={styles.communityRating}
          title="Discogs community average"
        >
          <StarIcon className={styles.communityStarIcon} aria-hidden />
          {formatCommunityRatingAverage(communityRating.average)} (
          {communityRating.count})
        </span>
      ) : null}
    </div>
  );
};
