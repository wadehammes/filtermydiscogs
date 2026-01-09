"use client";

import { useState } from "react";
import { useAuth } from "src/context/auth.context";
import type { CollectionHealth as CollectionHealthType } from "src/types/dashboard.types";
import styles from "./CollectionHealth.module.css";
import { DuplicatesList } from "./DuplicatesList.component";

interface CollectionHealthComponentProps {
  health: CollectionHealthType;
}

export function CollectionHealth({ health }: CollectionHealthComponentProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { state: authState } = useAuth();
  const { username } = authState;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const collectionUrl = username
    ? `https://www.discogs.com/user/${username}/collection`
    : null;

  return (
    <div className={styles.healthContainer}>
      <h2>Collection Health</h2>

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
              onClick={() => toggleSection("duplicates")}
            >
              {expandedSection === "duplicates" ? "Hide" : "Show"} Details
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
              onClick={() => toggleSection("potential")}
            >
              {expandedSection === "potential" ? "Hide" : "Show"} Details
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

      {expandedSection && (
        <div className={styles.detailsSection}>
          <DuplicatesList
            duplicateGroups={health.duplicateGroups.filter((g) =>
              expandedSection === "duplicates"
                ? g.type === "master_id"
                : g.type === "title_artist",
            )}
          />
        </div>
      )}
    </div>
  );
}
