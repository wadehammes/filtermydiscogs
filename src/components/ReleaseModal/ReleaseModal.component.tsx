import { useCallback } from "react";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleaseModal.module.css";

interface ReleaseModalProps {
  isOpen: boolean;
  release: DiscogsRelease | null;
  onClose: () => void;
}

export const ReleaseModal = ({
  isOpen,
  release,
  onClose,
}: ReleaseModalProps) => {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;
  if (!release) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-modal-title"
    >
      <div className={styles.modal}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        <div className={styles.content}>
          <div className={styles.releaseCardWrapper}>
            <ReleaseCard release={release} isHighlighted={false} />
          </div>
        </div>
      </div>
    </div>
  );
};
