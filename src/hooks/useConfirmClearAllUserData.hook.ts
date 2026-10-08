"use client";

import { useCallback, useState } from "react";
import { CLEAR_ALL_DATA_ERROR_MESSAGE } from "src/constants/clearData.constants";
import { useAuth } from "src/context/auth.context";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import { toast } from "src/utils/toast";

export const useConfirmClearAllUserData = () => {
  const { state: authState } = useAuth();
  const { clearAllUserData, isClearing } = useClearAllUserData();
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

  const openClearDataDialog = useCallback(() => {
    setIsClearDataDialogOpen(true);
  }, []);

  const closeClearDataDialog = useCallback(() => {
    if (isClearing) {
      return;
    }
    setIsClearDataDialogOpen(false);
  }, [isClearing]);

  const handleConfirmClear = useCallback(async () => {
    try {
      await clearAllUserData();
      setIsClearDataDialogOpen(false);
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error(CLEAR_ALL_DATA_ERROR_MESSAGE);
    }
  }, [clearAllUserData]);

  return {
    closeClearDataDialog,
    handleConfirmClear,
    isAuthenticated: authState.isAuthenticated,
    isClearDataDialogOpen,
    isClearing,
    openClearDataDialog,
  };
};
