"use client";

import { useCallback, useState } from "react";

export const useInlinePopoverMenuClose = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const runAction = useCallback(
    (action: () => void) => {
      closeMenu();
      action();
    },
    [closeMenu],
  );

  return {
    closeMenu,
    isOpen,
    runAction,
    setIsOpen,
  };
};
