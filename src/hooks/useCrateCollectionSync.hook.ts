import { useCallback, useState } from "react";
import { trackCrateSyncManual } from "src/analytics/productAnalyticsEvents";
import { useAuth } from "src/context/auth.context";
import { useSyncCratesMutation } from "src/hooks/mutations/useCrateMutations";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { prepareCollectionForSync } from "src/utils/syncCollection.helper";
import { toast } from "src/utils/toast";

export const useCrateCollectionSync = () => {
  const { state: authState } = useAuth();
  const { username, isAuthenticated, rateLimited, userId, isCheckingAuth } =
    authState;
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  const syncMutation = useSyncCratesMutation(userId);
  const queryEnabled =
    isAuthenticated && !!username && !rateLimited && !isCheckingAuth;

  const {
    data: collectionData,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscogsCollectionQuery({
    username: username || "",
    enabled: false,
  });

  const hasLoadedPages = (collectionData?.pages.length ?? 0) > 0;
  const isCollectionLoading =
    queryEnabled && (!hasLoadedPages || hasNextPage || isFetchingNextPage);
  const isSyncDisabled = syncMutation.isPending || isCollectionLoading;

  const openSyncDialog = useCallback(() => {
    setShowSyncDialog(true);
  }, []);

  const closeSyncDialog = useCallback(() => {
    setShowSyncDialog(false);
  }, []);

  const confirmSync = useCallback(() => {
    const syncResult = prepareCollectionForSync(
      collectionData,
      hasNextPage,
      isFetchingNextPage,
    );

    if (!syncResult.isValid) {
      toast.error(syncResult.error ?? "Unable to sync crates.");
      setShowSyncDialog(false);
      return;
    }

    if (!syncResult.instanceIds) {
      toast.error("No instance IDs found.");
      setShowSyncDialog(false);
      return;
    }

    syncMutation.mutate(
      { collectionInstanceIds: syncResult.instanceIds },
      {
        onSuccess: (data) => {
          setShowSyncDialog(false);
          trackCrateSyncManual(data.removedCount);
          if (data.removedCount > 0) {
            toast.success(
              `Sync complete: Removed ${data.removedCount} release${data.removedCount !== 1 ? "s" : ""} from your crates.`,
            );
          } else {
            toast.success(
              "Sync complete: All releases in your crates are still in your collection.",
            );
          }
        },
        onError: (error) => {
          toast.error(
            `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        },
      },
    );
  }, [collectionData, hasNextPage, isFetchingNextPage, syncMutation]);

  return {
    closeSyncDialog,
    confirmSync,
    isCollectionLoading,
    isSyncDisabled,
    isSyncing: syncMutation.isPending,
    openSyncDialog,
    showSyncDialog,
  };
};
