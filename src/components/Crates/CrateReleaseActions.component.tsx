"use client";

import classNames from "classnames";
import type { MouseEvent } from "react";
import CheckIcon from "src/styles/icons/check-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import styles from "./CrateReleaseActions.module.css";

interface CrateReleaseActionsProps {
  packedEnabled: boolean;
  packed: boolean;
  releaseTitle: string;
  onPackedChange: (packed: boolean) => void;
  onRemove: () => void;
}

export const CrateReleaseActions = ({
  packedEnabled,
  packed,
  releaseTitle,
  onPackedChange,
  onRemove,
}: CrateReleaseActionsProps) => {
  const handlePackedToggle = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onPackedChange(!packed);
  };

  const handleRemove = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  };

  return (
    <div className={styles.actions}>
      {packedEnabled ? (
        <button
          type="button"
          className={classNames(styles.action, {
            [styles.actionActive]: packed,
          })}
          onClick={handlePackedToggle}
          aria-label={
            packed
              ? `Unmark ${releaseTitle} as packed for gig`
              : `Mark ${releaseTitle} as packed for gig`
          }
          title={packed ? "Unmark as packed for gig" : "Mark as packed for gig"}
        >
          <CheckIcon className={styles.actionIcon} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        className={classNames(styles.action, styles.removeAction)}
        onClick={handleRemove}
        aria-label={`Remove ${releaseTitle} from crate`}
        title="Remove from crate"
      >
        <MinusIcon className={styles.actionIcon} aria-hidden />
      </button>
    </div>
  );
};
