"use client";

import Button from "src/components/Button/Button.component";
import { showPersistentActionToast } from "src/utils/actionToast";
import { toast } from "src/utils/toast";

const DEPLOYMENT_UPDATE_TOAST_ID = "deployment-update";

export const showDeploymentUpdateToast = ({
  onRefresh,
  onDismiss,
}: {
  onRefresh: () => void;
  onDismiss: () => void;
}) => {
  showPersistentActionToast({
    id: DEPLOYMENT_UPDATE_TOAST_ID,
    title: "Update available",
    description: "Refresh to load the latest version.",
    cancel: (
      <Button variant="secondary" size="sm" onPress={onDismiss}>
        Not now
      </Button>
    ),
    action: (
      <Button variant="primary" size="sm" onPress={onRefresh}>
        Refresh
      </Button>
    ),
  });
};

export const dismissDeploymentUpdateToast = () => {
  toast.dismiss(DEPLOYMENT_UPDATE_TOAST_ID);
};
