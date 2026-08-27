"use client";

import { toast } from "sonner";
import Button from "src/components/Button/Button.component";

const DEPLOYMENT_UPDATE_TOAST_ID = "deployment-update";

export const showDeploymentUpdateToast = ({
  onRefresh,
  onDismiss,
}: {
  onRefresh: () => void;
  onDismiss: () => void;
}) => {
  toast("Update available", {
    id: DEPLOYMENT_UPDATE_TOAST_ID,
    description: "Refresh to load the latest version.",
    position: "bottom-center",
    classNames: {
      toast: "fmd-toast fmd-action-toast fmd-deployment-update-toast",
      title: "fmd-toast-title",
      description: "fmd-toast-description",
      content: "fmd-action-toast-content",
    },
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
    duration: Number.POSITIVE_INFINITY,
  });
};

export const dismissDeploymentUpdateToast = () => {
  toast.dismiss(DEPLOYMENT_UPDATE_TOAST_ID);
};
