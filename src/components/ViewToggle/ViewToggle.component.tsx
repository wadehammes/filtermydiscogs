import classNames from "classnames";
import type { ViewMode } from "src/atoms/view.atoms";
import { IconButton } from "src/components/IconButton/IconButton.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import CratesIcon from "src/styles/icons/crates-thin.svg";
import DiceIcon from "src/styles/icons/dice-thin.svg";
import GridIcon from "src/styles/icons/grid-thin.svg";
import TableIcon from "src/styles/icons/table-thin.svg";
import styles from "./ViewToggle.module.css";

const scrollPageToTop = () => {
  window.scrollTo({ top: 0, behavior: "instant" });
};

export interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onRandomClick?: () => void;
  onCratesClick?: () => void;
  isCratesOpen?: boolean;
  className?: string;
}

export const ViewToggle = ({
  currentView,
  onViewChange,
  onRandomClick,
  onCratesClick,
  isCratesOpen,
  className = "",
}: ViewToggleProps) => {
  return (
    <div
      className={classNames(styles.wrapper, className)}
      data-testid="fmdViewToggle"
    >
      <SegmentedControl legend="Collection view mode">
        <IconButton
          className={classNames(segmentedStyles.segment, {
            [segmentedStyles.active]: currentView === "card",
          })}
          iconClassName={styles.segmentIcon}
          label="Grid"
          onClick={() => {
            scrollPageToTop();
            onViewChange("card");
          }}
          aria-label="Switch to card view"
          title="Card view"
        >
          <GridIcon />
        </IconButton>
        <IconButton
          className={classNames(
            segmentedStyles.segment,
            styles.listViewButton,
            {
              [segmentedStyles.active]: currentView === "list",
            },
          )}
          iconClassName={styles.segmentIcon}
          label="Table"
          onClick={() => {
            scrollPageToTop();
            onViewChange("list");
          }}
          aria-label="Switch to list view"
          title="List view"
        >
          <TableIcon />
        </IconButton>
        <IconButton
          className={classNames(segmentedStyles.segment, {
            [segmentedStyles.active]: currentView === "random",
          })}
          iconClassName={styles.segmentIcon}
          label="Random"
          onClick={() => {
            scrollPageToTop();
            if (currentView === "random" && onRandomClick) {
              onRandomClick();
            } else {
              onViewChange("random");
            }
          }}
          aria-label={
            currentView === "random"
              ? "Get another random release"
              : "Switch to random view"
          }
          title={
            currentView === "random"
              ? "Get another random release"
              : "Random view"
          }
        >
          <DiceIcon />
        </IconButton>
        {onCratesClick ? (
          <IconButton
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active]: isCratesOpen,
            })}
            iconClassName={styles.segmentIcon}
            label="Crates"
            onClick={onCratesClick}
            aria-label={isCratesOpen ? "Close crates" : "Open crates"}
            title={isCratesOpen ? "Close crates" : "View your crates"}
            aria-pressed={isCratesOpen}
          >
            <CratesIcon />
          </IconButton>
        ) : null}
      </SegmentedControl>
    </div>
  );
};
