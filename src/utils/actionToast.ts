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
  action,
  cancel,
}: {
  id: string;
  title: string;
  description: string;
  toastClassName?: string;
  action: ReactNode;
  cancel: ReactNode;
}) => {
  toast(title, {
    id,
    description,
    position: "bottom-center",
    duration: Number.POSITIVE_INFINITY,
    classNames: {
      ...ACTION_TOAST_CLASS_NAMES,
      toast: toastClassName
        ? `${ACTION_TOAST_CLASS_NAMES.toast} ${toastClassName}`
        : ACTION_TOAST_CLASS_NAMES.toast,
    },
    action,
    cancel,
  });
};
