"use client";

import { useEffect, useRef, useState } from "react";
import {
  dismissDeploymentUpdateToast,
  showDeploymentUpdateToast,
} from "src/components/DeploymentUpdateToast/deploymentUpdateToast";
import { useBuildVersionQuery } from "src/hooks/queries/useBuildVersionQuery";
import { useDeploymentBuildVersionEagerRefetch } from "src/hooks/useDeploymentBuildVersionEagerRefetch.hook";
import {
  getClientAppBuildVersion,
  isNewerBuildAvailable,
  shouldCheckForDeploymentUpdates,
} from "src/utils/appBuildVersion";
import { navigateToSamePageWithWhatsNewQuery } from "src/utils/whatsNewOpenFromQuery";

export const DeploymentUpdateToast = () => {
  const mountedVersionRef = useRef(getClientAppBuildVersion());
  const [updateDetected, setUpdateDetected] = useState(false);
  const pollingEnabled = shouldCheckForDeploymentUpdates() && !updateDetected;
  useDeploymentBuildVersionEagerRefetch(pollingEnabled);
  const { data } = useBuildVersionQuery({ enabled: pollingEnabled });

  useEffect(() => {
    if (!data || updateDetected) {
      return;
    }

    if (!isNewerBuildAvailable(mountedVersionRef.current, data.version)) {
      return;
    }

    setUpdateDetected(true);
    showDeploymentUpdateToast({
      onRefresh: () => {
        dismissDeploymentUpdateToast();
        navigateToSamePageWithWhatsNewQuery();
      },
      onDismiss: () => {
        dismissDeploymentUpdateToast();
      },
    });
  }, [data, updateDetected]);

  return null;
};
