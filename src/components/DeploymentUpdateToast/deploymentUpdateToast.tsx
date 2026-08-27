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
  toast("A new version is available", {
    id: DEPLOYMENT_UPDATE_TOAST_ID,
    description: "Refresh when you are ready to load the latest updates.",
    classNames: {
      toast: "fmd-toast fmd-deployment-update-toast",
      title: "fmd-toast-title",
      description: "fmd-toast-description",
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
