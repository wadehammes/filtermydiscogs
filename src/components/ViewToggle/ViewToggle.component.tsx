import classNames from "classnames";
import CratesIcon from "src/styles/icons/crates-solid.svg";
import DiceSolid from "src/styles/icons/dice-solid.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import styles from "./ViewToggle.module.css";

export type ViewMode = "card" | "list" | "random";

const scrollPageToTop = () => {
  window.scrollTo({ top: 0, behavior: "instant" });
};

interface ViewToggleProps {
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
  className,
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
            [segmentedStyles.active as string]: currentView === "card",
          })}
          onClick={() => {
            scrollPageToTop();
            onViewChange("card");
          }}
          aria-label="Switch to card view"
          title="Card view"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
          <span>Grid</span>
        </button>
        <button
          type="button"
          className={classNames(
            segmentedStyles.segment,
            styles.listViewButton,
            {
              [segmentedStyles.active as string]: currentView === "list",
            },
          )}
          onClick={() => {
            scrollPageToTop();
            onViewChange("list");
          }}
          aria-label="Switch to list view"
          title="List view"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1" y="2" width="14" height="2" rx="1" />
            <rect x="1" y="7" width="14" height="2" rx="1" />
            <rect x="1" y="12" width="14" height="2" rx="1" />
          </svg>
          <span>Table</span>
        </button>
        <button
          type="button"
          className={classNames(segmentedStyles.segment, {
            [segmentedStyles.active as string]: currentView === "random",
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
          <DiceSolid width="16" height="16" />
          <span>Random</span>
        </button>
        {onCratesClick && (
          <button
            type="button"
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active as string]: isCratesOpen,
            })}
            onClick={onCratesClick}
            aria-label={isCratesOpen ? "Close crates" : "Open crates"}
            title={isCratesOpen ? "Close crates" : "View your crates"}
          >
            <CratesIcon width="16" height="16" />
            <span>Crates</span>
          </button>
        )}
      </div>
    </div>
  );
};
