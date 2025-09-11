import type { FC } from "react";
import styles from "./ViewToggle.module.css";

export type ViewMode = "card" | "list";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewToggle: FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ""}`}>
      <button
        type="button"
        className={`${styles.toggleButton} ${
          currentView === "card" ? styles.active : ""
        }`}
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
      </button>
      <button
        type="button"
        className={`${styles.toggleButton} ${
          currentView === "list" ? styles.active : ""
        }`}
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
      </button>
    </div>
  );
};

export default ViewToggle;
