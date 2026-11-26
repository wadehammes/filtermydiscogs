import type { ReactNode } from "react";

export interface DrawerFooterMoreMenuProps {
  children: ReactNode;
  className?: string | undefined;
  disabled?: boolean;
  footerInset?: ReactNode;
  menuFooter?: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  panelTestId: string;
  popupClassName?: string | undefined;
  testId: string;
  triggerClassName?: string | undefined;
  triggerIconClassName?: string | undefined;
  triggerIcon?: ReactNode;
  triggerLabel?: string;
}
