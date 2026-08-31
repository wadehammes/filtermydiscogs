"use client";

import { Toast } from "@base-ui/react/toast";
import classNames from "classnames";
import { useMounted } from "src/hooks/useMounted.hook";
import type { FmdToastData } from "src/lib/toastManagers";
import { centerToastManager, toastManager } from "src/lib/toastManagers";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import XIcon from "src/styles/icons/x-thin.svg";
import styles from "./AppToaster.module.css";

type ToastViewportPosition = "bottom-right" | "bottom-center";

const viewportClassByPosition: Record<ToastViewportPosition, string> = {
  "bottom-right": styles.viewportBottomRight,
  "bottom-center": styles.viewportBottomCenter,
};

function ToastViewportList({ position }: { position: ToastViewportPosition }) {
  const { toasts } = Toast.useToastManager<FmdToastData>();

  return (
    <Toast.Portal>
      <Toast.Viewport className={viewportClassByPosition[position]}>
        {toasts.map((toastItem) => {
          const classNamesConfig = toastItem.data?.classNames;
          const toastIcon =
            toastItem.data?.icon ??
            (toastItem.type === "success" ? (
              <CheckThinIcon className={styles.successIcon} aria-hidden />
            ) : null);

          return (
            <Toast.Root
              key={toastItem.id}
              toast={toastItem}
              className={classNames(
                styles.root,
                "fmd-toast",
                classNamesConfig?.toast,
              )}
            >
              {toastIcon ? (
                <div
                  className={classNames(styles.icon, classNamesConfig?.icon)}
                  data-icon=""
                >
                  {toastIcon}
                </div>
              ) : null}
              <Toast.Content
                className={classNames(
                  styles.content,
                  classNamesConfig?.content,
                )}
              >
                {toastItem.title ? (
                  <Toast.Title
                    className={classNames(
                      styles.title,
                      "fmd-toast-title",
                      classNamesConfig?.title,
                    )}
                  >
                    {toastItem.title}
                  </Toast.Title>
                ) : null}
                {toastItem.description ? (
                  <Toast.Description
                    className={classNames(
                      styles.description,
                      "fmd-toast-description",
                      classNamesConfig?.description,
                    )}
                  >
                    {toastItem.description}
                  </Toast.Description>
                ) : null}
              </Toast.Content>
              {toastItem.data?.cancel || toastItem.data?.action ? (
                <div className={styles.actions}>
                  {toastItem.data.cancel ? (
                    <div className={styles.cancelSlot} data-cancel="">
                      {toastItem.data.cancel}
                    </div>
                  ) : null}
                  {toastItem.data.action ? (
                    <div className={styles.actionSlot} data-button="">
                      {toastItem.data.action}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {toastItem.data?.showClose ? (
                <Toast.Close
                  className={classNames(
                    styles.toastClose,
                    classNamesConfig?.close,
                  )}
                  aria-label="Dismiss notification"
                >
                  <XIcon className={styles.toastCloseIcon} aria-hidden />
                </Toast.Close>
              ) : null}
              {toastItem.actionProps ? (
                <Toast.Action {...toastItem.actionProps} />
              ) : null}
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function AppToaster() {
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Toast.Provider toastManager={toastManager} limit={3} timeout={5000}>
        <ToastViewportList position="bottom-right" />
      </Toast.Provider>
      <Toast.Provider
        toastManager={centerToastManager}
        limit={3}
        timeout={5000}
      >
        <ToastViewportList position="bottom-center" />
      </Toast.Provider>
    </>
  );
}
