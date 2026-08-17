"use client";

import { createPortal } from "react-dom";
import { Toaster } from "sonner";
import { useTheme } from "src/context/theme.context";
import { useMounted } from "src/hooks/useMounted.hook";
import { toSonnerTheme } from "src/utils/themeAppearance";

export function AppToaster() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return createPortal(
    <Toaster
      theme={toSonnerTheme(resolvedTheme)}
      richColors
      position="bottom-right"
      closeButton={false}
      expand={false}
      visibleToasts={3}
      offset="1rem"
      style={{ zIndex: "var(--z-8-toast)" }}
      toastOptions={{
        classNames: {
          toast: "fmd-toast",
          title: "fmd-toast-title",
          description: "fmd-toast-description",
        },
      }}
    />,
    document.body,
  );
}
