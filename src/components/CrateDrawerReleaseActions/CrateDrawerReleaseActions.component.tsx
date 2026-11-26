import type { DraggableAttributes } from "@dnd-kit/core";
import classNames from "classnames";
import type { MouseEvent, Ref } from "react";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import styles from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.module.css";
import { CrateDrawerReleaseRowMenu } from "src/components/CrateDrawerReleaseRowMenu/CrateDrawerReleaseRowMenu.component";
import { CrateReleasePackedToggleIcon } from "src/components/Crates/CrateReleasePackedToggleIcon.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import GripVerticalIcon from "src/styles/icons/grip-vertical-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import drawerSortableDragStyles from "src/styles/modules/drawer-sortable-drag.module.css";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";

interface CrateDrawerReleaseActionsProps {
  packed: boolean;
  releaseTitle: string;
  onPackedChange: (packed: boolean) => void;
  onRemove: () => void;
  setDragHandleRef?: Ref<HTMLButtonElement>;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: object;
}

export const CrateDrawerReleaseActions = ({
  packed,
  releaseTitle,
  onPackedChange,
  onRemove,
  setDragHandleRef,
  dragHandleAttributes,
  dragHandleListeners,
}: CrateDrawerReleaseActionsProps) => {
  const { packedEnabled } = useCrateDrawerContext();
  const isBelowDesktop = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);

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

  const dragHandle = setDragHandleRef ? (
    <div className={stackStyles.overlayActionSlot}>
      <IconButton
        ref={setDragHandleRef}
        variant="skip"
        className={classNames(
          stackStyles.overlayAction,
          drawerSortableDragStyles.dragHandle,
        )}
        iconClassName={drawerSortableDragStyles.dragHandleIcon}
        aria-label={`Reorder ${releaseTitle}`}
        title="Drag to reorder"
        {...(dragHandleAttributes ?? {})}
        {...(dragHandleListeners ?? {})}
      >
        <GripVerticalIcon />
      </IconButton>
    </div>
  ) : null;

  const removeButton = (
    <div className={stackStyles.overlayActionSlot}>
      <IconButton
        variant="minus"
        className={classNames(stackStyles.overlayAction, styles.removeAction)}
        iconClassName={stackStyles.actionIcon}
        onClick={handleRemove}
        aria-label={`Remove ${releaseTitle} from crate`}
        title="Remove from crate"
      >
        <MinusIcon />
      </IconButton>
    </div>
  );

  const packedToggle = packedEnabled ? (
    <div className={stackStyles.overlayActionSlot}>
      <IconButton
        className={stackStyles.overlayAction}
        iconClassName={stackStyles.actionIcon}
        onClick={handlePackedToggle}
        aria-pressed={packed}
        aria-label={
          packed
            ? `Unmark ${releaseTitle} as packed for gig`
            : `Mark ${releaseTitle} as packed for gig`
        }
        title={packed ? "Unmark as packed for gig" : "Mark as packed for gig"}
      >
        <CrateReleasePackedToggleIcon packed={packed} />
      </IconButton>
    </div>
  ) : null;

  if (isBelowDesktop && packedEnabled) {
    return (
      <div className={styles.listItemActions}>
        <div className={stackStyles.overlayActions}>
          {dragHandle}
          <div className={stackStyles.overlayActionSlot}>
            <CrateDrawerReleaseRowMenu
              packed={packed}
              releaseTitle={releaseTitle}
              onPackedChange={onPackedChange}
              onRemove={onRemove}
              triggerClassName={stackStyles.overlayAction}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listItemActions}>
      <div className={stackStyles.overlayActions}>
        {dragHandle}
        {packedToggle}
        {removeButton}
      </div>
    </div>
  );
};
