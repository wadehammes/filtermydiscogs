"use client";

import Button from "src/components/Button/Button.component";
import {
  EMAIL_ACCOUNT_CAPTURE_TOAST_ACTION_LABEL,
  EMAIL_ACCOUNT_CAPTURE_TOAST_DESCRIPTION,
  EMAIL_ACCOUNT_CAPTURE_TOAST_ID,
  EMAIL_ACCOUNT_CAPTURE_TOAST_TITLE,
} from "src/constants/emailAccountToast.constants";
import { showPersistentActionToast } from "src/utils/actionToast";
import { toast } from "src/utils/toast";

export const showEmailAccountCaptureToast = ({
  onOpenSettings,
  onDismiss,
}: {
  onOpenSettings: () => void;
  onDismiss: () => void;
}) => {
  showPersistentActionToast({
    id: EMAIL_ACCOUNT_CAPTURE_TOAST_ID,
    title: EMAIL_ACCOUNT_CAPTURE_TOAST_TITLE,
    description: EMAIL_ACCOUNT_CAPTURE_TOAST_DESCRIPTION,
    showClose: true,
    onClose: onDismiss,
    action: (
      <Button variant="primary" size="sm" onPress={onOpenSettings}>
        {EMAIL_ACCOUNT_CAPTURE_TOAST_ACTION_LABEL}
      </Button>
    ),
  });
};

export const dismissEmailAccountCaptureToast = () => {
  toast.dismiss(EMAIL_ACCOUNT_CAPTURE_TOAST_ID);
};
