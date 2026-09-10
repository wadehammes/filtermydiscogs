"use client";

import classNames from "classnames";
import type { MouseEvent } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
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
        <IconButton
          className={styles.action}
          iconClassName={styles.actionIcon}
          onClick={handlePackedToggle}
          aria-pressed={packed}
          aria-label={
            packed
              ? `Unmark ${releaseTitle} as packed for gig`
              : `Mark ${releaseTitle} as packed for gig`
          }
          title={packed ? "Unmark as packed for gig" : "Mark as packed for gig"}
        >
          <CheckThinIcon />
        </IconButton>
      ) : null}
      <IconButton
        variant="minus"
        className={classNames(styles.action, styles.removeAction)}
        iconClassName={styles.actionIcon}
        onClick={handleRemove}
        aria-label={`Remove ${releaseTitle} from crate`}
        title="Remove from crate"
      >
        <MinusIcon />
      </IconButton>
    </div>
  );
};
