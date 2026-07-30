import classNames from "classnames";
import type { MouseEvent } from "react";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import stackStyles from "src/styles/vertical-action-stack.module.css";
import styles from "./CrateDrawer.module.css";

interface CrateDrawerReleaseActionsProps {
  releaseTitle: string;
  onRemove: () => void;
}

export const CrateDrawerReleaseActions = ({
  releaseTitle,
  onRemove,
}: CrateDrawerReleaseActionsProps) => {
  const handleRemove = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  };

  return (
    <div className={styles.listItemActions}>
      <div className={stackStyles.overlayActions}>
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
