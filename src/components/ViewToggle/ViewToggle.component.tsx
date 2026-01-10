import classNames from "classnames";
import type { FC } from "react";
import CratesIcon from "src/styles/icons/crates-solid.svg";
import DiceSolid from "src/styles/icons/dice-solid.svg";
import styles from "./ViewToggle.module.css";

export type ViewMode = "card" | "list" | "random";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onRandomClick?: () => void;
  onCratesClick?: () => void;
  isCratesOpen?: boolean;
  className?: string;
}

export const ViewToggle: FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  onRandomClick,
  onCratesClick,
  isCratesOpen,
  className,
}) => {
  return (
    <div className={classNames(styles.wrapper, className)}>
      <div className={styles.container}>
        <button
          type="button"
          className={classNames(styles.toggleButton, {
            [styles.active as string]: currentView === "card",
          })}
          onClick={() => onViewChange("card")}
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
          className={classNames(styles.toggleButton, {
            [styles.active as string]: currentView === "list",
          })}
          onClick={() => onViewChange("list")}
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
          className={classNames(styles.toggleButton, {
            [styles.active as string]: currentView === "random",
          })}
          onClick={() => {
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
      </div>
      {onCratesClick && (
        <button
          type="button"
          className={classNames(styles.cratesButton, {
            [styles.active as string]: isCratesOpen,
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
  );
};

export default ViewToggle;
