import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { clearData } from "src/api/helpers";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import { useCollectionReset } from "src/hooks/useCollectionReset.hook";
import { clearClientStoredData } from "src/utils/clearClientStoredData";

export const useClearAllUserData = () => {
  const { logout } = useAuth();
  const resetCollection = useCollectionReset();
  const { clearCrate } = useCrate();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  const clearAllUserData = useCallback(async () => {
    setIsClearing(true);

    try {
      await clearData();
      clearClientStoredData();
      queryClient.clear();
      resetCollection();
      clearCrate();
      await logout();
      router.replace("/");
    } catch (error) {
      setIsClearing(false);
      throw error;
    }
  }, [clearCrate, logout, queryClient, resetCollection, router]);

  return {
    clearAllUserData,
    isClearing,
  };
};
