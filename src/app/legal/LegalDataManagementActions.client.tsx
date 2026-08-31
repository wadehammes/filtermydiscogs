"use client";

import Button from "src/components/Button/Button.component";
import { useConfirmClearAllUserData } from "src/hooks/useConfirmClearAllUserData.hook";
import styles from "./page.module.css";

export function LegalDataManagementActions() {
  const { confirmClearAllUserData, isAuthenticated, isClearing } =
    useConfirmClearAllUserData();

  return (
    <>
      <div className={styles.clearDataButton}>
        <Button
          variant="danger"
          size="md"
          onPress={confirmClearAllUserData}
          disabled={isClearing || !isAuthenticated}
          aria-label="Clear all data"
        >
          {isClearing ? "Clearing..." : "Clear All Data"}
        </Button>
      </div>
      {!isAuthenticated && (
        <p className={styles.clearDataNote}>
          You must be logged in to clear data.
        </p>
      )}
    </>
  );
}
