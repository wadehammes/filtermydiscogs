"use client";

import { createPortal } from "react-dom";

interface AnchoredPopoverPortalProps {
  children: React.ReactNode;
}

export const AnchoredPopoverPortal = ({
  children,
}: AnchoredPopoverPortalProps) => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
};
