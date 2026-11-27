import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { trackUserDataCleared } from "src/analytics/productAnalyticsEvents";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import { useClearDataMutation } from "src/hooks/mutations/useAuthMutations";
import { useCollectionReset } from "src/hooks/useCollectionReset.hook";
import { clearClientStoredData } from "src/utils/clearClientStoredData";
import { clearWhatsNewLastSeenForUser } from "src/utils/whatsNewLastSeen";

export const useClearAllUserData = () => {
  const {
    logout,
    state: { userId },
  } = useAuth();
  const resetCollection = useCollectionReset();
  const { clearCrate } = useCrate();
  const queryClient = useQueryClient();
  const router = useRouter();
  const clearDataMutation = useClearDataMutation();
  const [isClearing, setIsClearing] = useState(false);

  const clearAllUserData = useCallback(async () => {
    setIsClearing(true);

    try {
      trackUserDataCleared();
      await clearDataMutation.mutateAsync();
      if (userId) {
        clearWhatsNewLastSeenForUser(userId);
      }
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
  }, [
    clearCrate,
    clearDataMutation,
    logout,
    queryClient,
    resetCollection,
    router,
    userId,
  ]);

  return {
    clearAllUserData,
    isClearing,
  };
};
