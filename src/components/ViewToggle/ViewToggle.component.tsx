import type { FC } from "react";
import styles from "./ViewToggle.module.css";

export type ViewMode = "card" | "list" | "random";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onRandomClick?: () => void;
  className?: string;
}

export const ViewToggle: FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  onRandomClick,
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
      <button
        type="button"
        className={`${styles.toggleButton} ${
          currentView === "random" ? styles.active : ""
        }`}
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
          <path d="M8 2C4.69 2 2 4.69 2 8s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
          <path d="M8 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          <path d="M8 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
    </div>
  );
};

export default ViewToggle;
