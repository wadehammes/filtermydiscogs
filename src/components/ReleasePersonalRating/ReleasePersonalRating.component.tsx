"use client";

import classNames from "classnames";
import { useReleaseRatingEditor } from "src/components/ReleasePersonalRating/useReleaseRatingEditor.hook";
import { ReleaseRatingPicker } from "src/components/ReleaseRatingPicker/ReleaseRatingPicker.component";
import styles from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.module.css";
import typographyStyles from "src/styles/modules/typography.module.css";
import type { DiscogsRelease } from "src/types";

interface ReleasePersonalRatingProps {
  release: DiscogsRelease;
}

export const ReleasePersonalRating = ({
  release,
}: ReleasePersonalRatingProps) => {
  const { errorMessage, handleRate, isSaving, rating } =
    useReleaseRatingEditor(release);

  return (
    <>
      <ReleaseRatingPicker
        rating={rating}
        onRate={handleRate}
        isSaving={isSaving}
      />
      {errorMessage ? (
        <p
          className={classNames(
            typographyStyles.metaCaption,
            styles.ratingError,
          )}
        >
          {errorMessage}
        </p>
      ) : null}
    </>
  );
};
