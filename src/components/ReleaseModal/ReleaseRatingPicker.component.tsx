"use client";

import classNames from "classnames";
import { useId, useState } from "react";
import { COLLECTION_RATING_MAX } from "src/constants/collection";
import accessibilityStyles from "src/styles/accessibility.module.css";
import StarSolidIcon from "src/styles/icons/star-solid.svg";
import StarOutlineIcon from "src/styles/icons/star-thin.svg";
import styles from "./ReleaseRatingPicker.module.css";

interface ReleaseRatingPickerProps {
  rating: number;
  onRate: (rating: number) => void;
  isSaving?: boolean;
}

export const ReleaseRatingPicker = ({
  rating,
  onRate,
  isSaving = false,
}: ReleaseRatingPickerProps) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const isHovering = hoverRating !== null;
  const fieldsetId = useId();
  const radioName = `${fieldsetId}-release-rating`;
  const stars = Array.from(
    { length: COLLECTION_RATING_MAX },
    (_, index) => index + 1,
  );

  const clearHoverRating = () => {
    setHoverRating(null);
  };

  return (
    <fieldset
      className={styles.stars}
      data-testid="fmdReleaseRatingPicker"
      disabled={isSaving}
      onMouseLeave={clearHoverRating}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          clearHoverRating();
        }
      }}
    >
      <legend className={accessibilityStyles.visuallyHidden}>
        Your collection rating
      </legend>
      {stars.map((starValue) => {
        const inputId = `${radioName}-${starValue}`;
        const isIncluded = isHovering && starValue < hoverRating;
        const isHoverTarget = isHovering && starValue === hoverRating;
        const isDimmed = isHovering && starValue > hoverRating;
        const isFilled =
          isIncluded || isHoverTarget || (!isHovering && starValue <= rating);

        return (
          <label
            key={starValue}
            htmlFor={inputId}
            className={classNames(styles.starButton, {
              [styles.starButtonFilled]: !isHovering && starValue <= rating,
              [styles.starButtonIncluded]: isIncluded,
              [styles.starButtonHoverTarget]: isHoverTarget,
              [styles.starButtonDimmed]: isDimmed,
            })}
            onMouseEnter={() => {
              setHoverRating(starValue);
            }}
          >
            <input
              id={inputId}
              type="radio"
              name={radioName}
              value={starValue}
              checked={rating === starValue}
              className={accessibilityStyles.visuallyHidden}
              onChange={() => {
                onRate(starValue);
              }}
              onClick={() => {
                if (rating === starValue) {
                  onRate(starValue);
                }
              }}
              onFocus={() => {
                setHoverRating(starValue);
              }}
            />
            {isFilled ? (
              <StarSolidIcon className={styles.starIcon} aria-hidden />
            ) : (
              <StarOutlineIcon className={styles.starIcon} aria-hidden />
            )}
            <span className={accessibilityStyles.visuallyHidden}>
              Rate {starValue} out of {COLLECTION_RATING_MAX}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};
