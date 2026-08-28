"use client";

import { toast } from "sonner";
import Button from "src/components/Button/Button.component";
import { showPersistentActionToast } from "src/utils/actionToast";

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
  showPersistentActionToast({
    id: PENDING_FILTERS_RESTORE_TOAST_ID,
    title: PENDING_FILTERS_RESTORE_TOAST_MESSAGE,
    description: buildRestoreToastDescription({ totalCount, filteredCount }),
    toastClassName: "fmd-pending-restore-toast",
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
  });
};

export const dismissPendingFiltersRestoreToast = () => {
  toast.dismiss(PENDING_FILTERS_RESTORE_TOAST_ID);
};
