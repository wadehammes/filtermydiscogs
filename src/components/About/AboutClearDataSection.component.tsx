"use client";

import classNames from "classnames";
import Link from "next/link";
import Button from "src/components/Button/Button.component";
import { ABOUT_DATA_DELETION_ITEMS } from "src/constants/about.constants";
import { useConfirmClearAllUserData } from "src/hooks/useConfirmClearAllUserData.hook";
import typography from "src/styles/modules/typography.module.css";
import styles from "./About.module.css";

export const AboutClearDataSection = () => {
  const { confirmClearAllUserData, isAuthenticated, isClearing } =
    useConfirmClearAllUserData();

  return (
    <section
      className={classNames(styles.tile, styles.tileClearData)}
      aria-labelledby="about-data"
    >
      <div className={styles.clearDataIntro}>
        <p className={typography.sectionEyebrow}>Data</p>
        <h2 id="about-data" className={styles.tileTitle}>
          Clear stored data
        </h2>
        <p className={styles.tileBody}>
          Wipe auth, crates, preferences, and local caches on this app. Your
          Discogs collection and notes stay on Discogs.
        </p>
      </div>

      <ul className={styles.clearDataList}>
        {ABOUT_DATA_DELETION_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className={styles.clearDataFooter}>
        <Button
          variant="danger"
          size="md"
          onPress={confirmClearAllUserData}
          disabled={isClearing || !isAuthenticated}
          aria-label="Clear all data"
        >
          {isClearing ? "Clearing..." : "Clear All Data"}
        </Button>
        <div className={styles.clearDataMeta}>
          {!isAuthenticated && (
            <p className={styles.clearDataNote}>
              You must be logged in to clear data.
            </p>
          )}
          <p className={styles.clearDataNote}>
            <Link href="/legal" className={styles.link}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
