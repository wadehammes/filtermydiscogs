import type { ReactNode } from "react";
import {
  centerToastManager,
  type FmdToastClassNames,
  toastManager,
} from "src/lib/toastManagers";

export type ToastPosition = "bottom-right" | "bottom-center";

export interface ToastOptions {
  id?: string;
  description?: ReactNode;
  duration?: number;
  position?: ToastPosition;
  action?: ReactNode;
  cancel?: ReactNode;
  icon?: ReactNode;
  showClose?: boolean;
  onClose?: () => void;
  classNames?: FmdToastClassNames;
}

const getManager = (position?: ToastPosition) =>
  position === "bottom-center" ? centerToastManager : toastManager;

const toTimeout = (duration?: number): number | undefined => {
  if (duration === undefined) {
    return undefined;
  }

  if (duration === Number.POSITIVE_INFINITY) {
    return 0;
  }

  return duration;
};

const addToast = (
  title: ReactNode,
  type: string | undefined,
  options: ToastOptions = {},
) => {
  const manager = getManager(options.position);

  return manager.add({
    id: options.id,
    title,
    description: options.description,
    type,
    timeout: toTimeout(options.duration),
    ...(options.onClose !== undefined ? { onClose: options.onClose } : {}),
    data: {
      ...(options.icon !== undefined ? { icon: options.icon } : {}),
      ...(options.action !== undefined ? { action: options.action } : {}),
      ...(options.cancel !== undefined ? { cancel: options.cancel } : {}),
      ...(options.showClose !== undefined
        ? { showClose: options.showClose }
        : {}),
      ...(options.classNames !== undefined
        ? { classNames: options.classNames }
        : {}),
    },
  });
};

const dismiss = (id?: string) => {
  toastManager.close(id);
  centerToastManager.close(id);
};

export const toast = Object.assign(
  (title: ReactNode, options: ToastOptions = {}) =>
    addToast(title, undefined, options),
  {
    success: (title: ReactNode, options: ToastOptions = {}) =>
      addToast(title, "success", options),
    error: (title: ReactNode, options: ToastOptions = {}) =>
      addToast(title, "error", options),
    loading: (title: ReactNode, options: ToastOptions = {}) =>
      addToast(title, "loading", options),
    dismiss,
  },
);
