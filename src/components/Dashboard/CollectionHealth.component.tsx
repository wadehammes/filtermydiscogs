"use client";

import { useMemo, useState } from "react";
import { useAuth } from "src/context/auth.context";
import type { CollectionHealth as CollectionHealthType } from "src/types/dashboard.types";
import { definedProps } from "src/utils/definedProps";
import styles from "./CollectionHealth.module.css";
import { DuplicatesDetailModal } from "./DuplicatesDetailModal.component";

type DuplicateDetailModal = "duplicates" | "potential";

interface CollectionHealthComponentProps {
  health: CollectionHealthType;
  hideHeading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

export function CollectionHealth({
  health,
  hideHeading = false,
  onReleaseClick,
}: CollectionHealthComponentProps) {
  const [detailModal, setDetailModal] = useState<DuplicateDetailModal | null>(
    null,
  );
  const { state: authState } = useAuth();
  const { username } = authState;

  const collectionUrl = username
    ? `https://www.discogs.com/user/${username}/collection`
    : null;

  const exactDuplicateGroups = useMemo(
    () => health.duplicateGroups.filter((group) => group.type === "master_id"),
    [health.duplicateGroups],
  );

  const potentialDuplicateGroups = useMemo(
    () =>
      health.duplicateGroups.filter((group) => group.type === "title_artist"),
    [health.duplicateGroups],
  );

  const activeModal =
    detailModal === "duplicates"
      ? {
          title: "Exact duplicates",
          description: "Releases with the same master ID",
          duplicateGroups: exactDuplicateGroups,
        }
      : detailModal === "potential"
        ? {
            title: "Potential duplicates",
            description: "Releases with the same title and artist",
            duplicateGroups: potentialDuplicateGroups,
          }
        : null;

  return (
    <div className={styles.healthContainer}>
      {!hideHeading && <h2>Collection Health</h2>}

      <div className={styles.healthGrid}>
        <div className={styles.healthCard}>
          <div className={styles.healthLabel}>Exact Duplicates</div>
          <div className={styles.healthValue}>{health.duplicateCount}</div>
          <div className={styles.healthDescription}>
            Releases with the same master ID
          </div>
          {health.duplicateCount > 0 && (
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setDetailModal("duplicates")}
            >
              Show details
            </button>
          )}
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthLabel}>Potential Duplicates</div>
          <div className={styles.healthValue}>{health.potentialDuplicates}</div>
          <div className={styles.healthDescription}>
            Releases with same title and artist
          </div>
          {health.potentialDuplicates > 0 && (
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setDetailModal("potential")}
            >
              Show details
            </button>
          )}
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthLabel}>Unrated Releases</div>
          <div className={styles.healthValue}>
            {health.releasesWithoutRating}
          </div>
          <div className={styles.healthDescription}>
            Releases without a rating
          </div>
          {health.releasesWithoutRating > 0 && collectionUrl && (
            <a
              href={collectionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.rateLink}
            >
              Go rate your releases
            </a>
          )}
        </div>
      </div>

      <DuplicatesDetailModal
        isOpen={activeModal !== null}
        title={activeModal?.title ?? ""}
        description={activeModal?.description ?? ""}
        duplicateGroups={activeModal?.duplicateGroups ?? []}
        onClose={() => setDetailModal(null)}
        {...definedProps({ onReleaseClick })}
      />
    </div>
  );
}
