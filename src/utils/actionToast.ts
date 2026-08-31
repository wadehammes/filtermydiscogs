import type { ReactNode } from "react";
import { toast } from "src/utils/toast";

export const ACTION_TOAST_CLASS_NAMES = {
  toast: "fmd-toast fmd-action-toast",
  title: "fmd-toast-title",
  description: "fmd-toast-description",
  content: "fmd-action-toast-content",
} as const;

export const showPersistentActionToast = ({
  id,
  title,
  description,
  toastClassName,
  icon,
  action,
  cancel,
  showClose,
  onClose,
}: {
  id: string;
  title: string;
  description: string;
  toastClassName?: string;
  icon?: ReactNode;
  action: ReactNode;
  cancel?: ReactNode;
  showClose?: boolean;
  onClose?: () => void;
}) => {
  toast(title, {
    id,
    description,
    position: "bottom-center",
    duration: Number.POSITIVE_INFINITY,
    ...(icon !== undefined ? { icon } : {}),
    ...(cancel !== undefined ? { cancel } : {}),
    ...(showClose !== undefined ? { showClose } : {}),
    ...(onClose !== undefined ? { onClose } : {}),
    classNames: {
      ...ACTION_TOAST_CLASS_NAMES,
      toast: toastClassName
        ? `${ACTION_TOAST_CLASS_NAMES.toast} ${toastClassName}`
        : ACTION_TOAST_CLASS_NAMES.toast,
    },
    action,
  });
};
