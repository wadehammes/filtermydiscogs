import classNames from "classnames";
import type { MouseEvent } from "react";
import CheckIcon from "src/styles/icons/check-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import stackStyles from "src/styles/vertical-action-stack.module.css";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";

interface CrateDrawerReleaseActionsProps {
  packed: boolean;
  releaseTitle: string;
  onPackedChange: (packed: boolean) => void;
  onRemove: () => void;
}

export const CrateDrawerReleaseActions = ({
  packed,
  releaseTitle,
  onPackedChange,
  onRemove,
}: CrateDrawerReleaseActionsProps) => {
  const { packedEnabled } = useCrateDrawerContext();

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
    <div className={styles.listItemActions}>
      <div className={stackStyles.overlayActions}>
        {packedEnabled ? (
          <div className={stackStyles.overlayActionSlot}>
            <button
              type="button"
              className={classNames(stackStyles.overlayAction, {
                [stackStyles.overlayActionActive]: packed,
              })}
              onClick={handlePackedToggle}
              aria-label={
                packed
                  ? `Unmark ${releaseTitle} as packed`
                  : `Mark ${releaseTitle} as packed`
              }
              title={packed ? "Unmark as packed" : "Mark as packed"}
            >
              <CheckIcon className={stackStyles.actionIcon} aria-hidden />
            </button>
          </div>
        ) : null}
        <div className={stackStyles.overlayActionSlot}>
          <button
            type="button"
            className={classNames(
              stackStyles.overlayAction,
              styles.removeAction,
            )}
            onClick={handleRemove}
            aria-label={`Remove ${releaseTitle} from crate`}
            title="Remove from crate"
          >
            <MinusIcon className={stackStyles.actionIcon} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
