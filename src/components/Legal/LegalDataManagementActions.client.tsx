"use client";

import Button from "src/components/Button/Button.component";
import { ClearAllDataConfirmDialog } from "src/components/ClearAllDataConfirmDialog/ClearAllDataConfirmDialog.component";
import { useConfirmClearAllUserData } from "src/hooks/useConfirmClearAllUserData.hook";
import styles from "./Legal.module.css";

export function LegalDataManagementActions() {
  const {
    closeClearDataDialog,
    handleConfirmClear,
    isAuthenticated,
    isClearDataDialogOpen,
    isClearing,
    openClearDataDialog,
  } = useConfirmClearAllUserData();

  return (
    <>
      <div className={styles.clearDataButton}>
        <Button
          variant="danger"
          size="md"
          onPress={openClearDataDialog}
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
      <ClearAllDataConfirmDialog
        isOpen={isClearDataDialogOpen}
        onClose={closeClearDataDialog}
        onConfirm={() => {
          void handleConfirmClear();
        }}
        isConfirming={isClearing}
      />
    </>
  );
}
