"use client";

import classNames from "classnames";
import typographyStyles from "src/styles/typography.module.css";
import type { DiscogsRelease } from "src/types";
import { ReleaseRatingPicker } from "./ReleaseRatingPicker.component";
import styles from "./ReleaseSummaryHero.module.css";
import { useReleaseRatingEditor } from "./useReleaseRatingEditor.hook";

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
