import Button from "src/components/Button/Button.component";
import { FormDialog } from "src/components/FormDialog/FormDialog.component";

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
    <FormDialog
      open={isOpen}
      onClose={onCancel}
      testId="fmdConfirmDialog"
      title={title}
      description={message}
      titleId="dialog-title"
      descriptionId="dialog-message"
      footer={
        <>
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
        </>
      }
    />
  );
};
