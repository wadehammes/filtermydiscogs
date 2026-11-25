"use client";

import Button from "src/components/Button/Button.component";
import { ClearAllDataConfirmDialog } from "src/components/ClearAllDataConfirmDialog/ClearAllDataConfirmDialog.component";
import {
  CLEAR_ALL_DATA_ACTION_LABEL,
  CLEAR_ALL_DATA_ACTION_LOADING_LABEL,
  CLEAR_ALL_DATA_LOGIN_REQUIRED_NOTE,
} from "src/constants/clearData.constants";
import { useConfirmClearAllUserData } from "src/hooks/useConfirmClearAllUserData.hook";
import styles from "./Legal.module.css";

export const LegalDataManagementActions = () => {
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
          aria-label={CLEAR_ALL_DATA_ACTION_LABEL}
        >
          {isClearing
            ? CLEAR_ALL_DATA_ACTION_LOADING_LABEL
            : CLEAR_ALL_DATA_ACTION_LABEL}
        </Button>
      </div>
      {!isAuthenticated && (
        <p className={styles.clearDataNote}>
          {CLEAR_ALL_DATA_LOGIN_REQUIRED_NOTE}
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
};
