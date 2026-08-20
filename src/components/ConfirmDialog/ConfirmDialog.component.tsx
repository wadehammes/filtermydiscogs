import { Dialog } from "@base-ui/react/dialog";
import { AppDialog } from "src/components/AppDialog/AppDialog.component";
import Button from "src/components/Button/Button.component";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) => {
  return (
    <AppDialog
      open={isOpen}
      onClose={onCancel}
      testId="fmdConfirmDialog"
      ariaLabelledBy="dialog-title"
      ariaDescribedBy="dialog-message"
      panelClassName={styles.dialog}
    >
      <Dialog.Title id="dialog-title" className={styles.title}>
        {title}
      </Dialog.Title>
      <Dialog.Description id="dialog-message" className={styles.message}>
        {message}
      </Dialog.Description>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          onPress={onCancel}
          disabled={isConfirming}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          size="md"
          onPress={onConfirm}
          disabled={isConfirming}
        >
          {confirmLabel}
        </Button>
      </div>
    </AppDialog>
  );
};
