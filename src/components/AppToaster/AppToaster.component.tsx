"use client";

import { Toaster } from "sonner";
import { useTheme } from "src/context/theme.context";

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme}
      position="bottom-right"
      closeButton={false}
      expand={false}
      visibleToasts={3}
      offset="1rem"
      toastOptions={{
        classNames: {
          toast: "fmd-toast",
          title: "fmd-toast-title",
        },
      }}
    />
  );
}
