"use client";

import { toast } from "sonner";
import Button from "src/components/Button/Button.component";

const PENDING_FILTERS_RESTORE_TOAST_ID = "pending-filters-restore";

const PENDING_FILTERS_RESTORE_TOAST_MESSAGE = "Resume previous session?";

const buildRestoreToastDescription = ({
  totalCount,
  filteredCount,
}: {
  totalCount: number;
  filteredCount: number;
}): string => {
  if (totalCount === 0) {
    return "Pick up where you left off with your last search and filters.";
  }

  return `${totalCount.toLocaleString()} releases → ${filteredCount.toLocaleString()} matches`;
};

export const showPendingFiltersRestoreToast = ({
  totalCount,
  filteredCount,
  onApply,
  onDismiss,
}: {
  totalCount: number;
  filteredCount: number;
  onApply: () => void;
  onDismiss: () => void;
}) => {
  toast(PENDING_FILTERS_RESTORE_TOAST_MESSAGE, {
    id: PENDING_FILTERS_RESTORE_TOAST_ID,
    description: buildRestoreToastDescription({ totalCount, filteredCount }),
    position: "bottom-center",
    classNames: {
      toast: "fmd-toast fmd-action-toast fmd-pending-restore-toast",
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
      <Button variant="primary" size="sm" onPress={onApply}>
        Resume
      </Button>
    ),
    duration: Number.POSITIVE_INFINITY,
  });
};

export const dismissPendingFiltersRestoreToast = () => {
  toast.dismiss(PENDING_FILTERS_RESTORE_TOAST_ID);
};
