"use client";

import { useCallback } from "react";
import {
  CLEAR_ALL_DATA_CONFIRM_MESSAGE,
  CLEAR_ALL_DATA_ERROR_MESSAGE,
} from "src/constants/clearData.constants";
import { useAuth } from "src/context/auth.context";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import { toast } from "src/utils/toast";

export const useConfirmClearAllUserData = () => {
  const { state: authState } = useAuth();
  const { clearAllUserData, isClearing } = useClearAllUserData();

  const confirmClearAllUserData = useCallback(async () => {
    if (!confirm(CLEAR_ALL_DATA_CONFIRM_MESSAGE)) {
      return;
    }

    try {
      await clearAllUserData();
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error(CLEAR_ALL_DATA_ERROR_MESSAGE);
    }
  }, [clearAllUserData]);

  return {
    confirmClearAllUserData,
    isClearing,
    isAuthenticated: authState.isAuthenticated,
  };
};
