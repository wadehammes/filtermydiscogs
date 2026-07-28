"use client";

import { Toaster } from "sonner";
import { useTheme } from "src/context/theme.context";
import { toSonnerTheme } from "src/utils/themeAppearance";

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={toSonnerTheme(resolvedTheme)}
      richColors
      position="bottom-right"
      closeButton={false}
      expand={false}
      visibleToasts={3}
      offset="1rem"
      toastOptions={{
        classNames: {
          toast: "fmd-toast",
          title: "fmd-toast-title",
          description: "fmd-toast-description",
        },
      }}
    />
  );
}
