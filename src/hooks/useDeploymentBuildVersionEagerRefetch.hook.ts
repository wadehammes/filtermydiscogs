import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BuildVersionQueryKeys } from "src/hooks/queries/querykeys.constants";
import { shouldEagerRefetchBuildVersionOnVisibility } from "src/utils/deploymentBuildVersionPolling";

export const useDeploymentBuildVersionEagerRefetch = (
  pollingEnabled: boolean,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pollingEnabled) {
      return;
    }

    const refetchBuildVersion = () => {
      void queryClient.refetchQueries({
        queryKey: BuildVersionQueryKeys.all(),
      });
    };

    const onVisibilityChange = () => {
      if (
        shouldEagerRefetchBuildVersionOnVisibility(document.visibilityState)
      ) {
        refetchBuildVersion();
      }
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refetchBuildVersion();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pollingEnabled, queryClient]);
};
