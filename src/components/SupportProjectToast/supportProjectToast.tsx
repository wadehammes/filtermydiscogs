"use client";

import styles from "src/components/AppToaster/AppToaster.module.css";
import Button from "src/components/Button/Button.component";
import { SUPPORT_PROJECT_TOAST_ID } from "src/constants/supportProjectToast.constants";
import { HeartSolidIcon } from "src/styles/icons/HeartSolidIcon.component";
import { showPersistentActionToast } from "src/utils/actionToast";
import { toast } from "src/utils/toast";

export const showSupportProjectToast = ({
  onLearnMore,
  onDismiss,
}: {
  onLearnMore: () => void;
  onDismiss: () => void;
}) => {
  showPersistentActionToast({
    id: SUPPORT_PROJECT_TOAST_ID,
    title: "Enjoying FilterMyDiscogs?",
    description:
      "If this app helps you dig through your collection, consider supporting the project.",
    toastClassName: "fmd-support-project-toast",
    icon: <HeartSolidIcon className={styles.supportProjectIcon} />,
    showClose: true,
    onClose: onDismiss,
    action: (
      <Button variant="primary" size="sm" onPress={onLearnMore}>
        Support now
      </Button>
    ),
  });
};

export const dismissSupportProjectToast = () => {
  toast.dismiss(SUPPORT_PROJECT_TOAST_ID);
};
