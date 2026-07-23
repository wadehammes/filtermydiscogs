import classNames from "classnames";
import type { ViewMode } from "src/atoms/view.atoms";
import CratesIcon from "src/styles/icons/crates-thin.svg";
import DiceIcon from "src/styles/icons/dice-thin.svg";
import GridIcon from "src/styles/icons/grid-thin.svg";
import ListIcon from "src/styles/icons/list-thin.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
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
      <div className={segmentedStyles.container}>
        <button
          type="button"
          className={classNames(segmentedStyles.segment, {
            [segmentedStyles.active]: currentView === "card",
          })}
          onClick={() => {
            scrollPageToTop();
            onViewChange("card");
          }}
          aria-label="Switch to card view"
          title="Card view"
        >
          <span className={styles.segmentIcon} aria-hidden>
            <GridIcon />
          </span>
          <span>Grid</span>
        </button>
        <button
          type="button"
          className={classNames(
            segmentedStyles.segment,
            styles.listViewButton,
            {
              [segmentedStyles.active]: currentView === "list",
            },
          )}
          onClick={() => {
            scrollPageToTop();
            onViewChange("list");
          }}
          aria-label="Switch to list view"
          title="List view"
        >
          <span className={styles.segmentIcon} aria-hidden>
            <ListIcon />
          </span>
          <span>Table</span>
        </button>
        <button
          type="button"
          className={classNames(segmentedStyles.segment, {
            [segmentedStyles.active]: currentView === "random",
          })}
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
          <span className={styles.segmentIcon} aria-hidden>
            <DiceIcon />
          </span>
          <span>Random</span>
        </button>
        {onCratesClick && (
          <button
            type="button"
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active]: isCratesOpen,
            })}
            onClick={onCratesClick}
            aria-label={isCratesOpen ? "Close crates" : "Open crates"}
            title={isCratesOpen ? "Close crates" : "View your crates"}
            aria-pressed={isCratesOpen}
          >
            <span className={styles.segmentIcon} aria-hidden>
              <CratesIcon />
            </span>
            <span>Crates</span>
          </button>
        )}
      </div>
    </div>
  );
};
