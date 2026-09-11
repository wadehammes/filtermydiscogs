"use client";

import { type ReactNode, ViewTransition } from "react";

type ViewTransitionShellMode = "mount" | "deferredUpdate" | "content";

interface ViewTransitionShellProps {
  children: ReactNode;
  mode?: ViewTransitionShellMode;
}

const modeProps = {
  mount: {
    default: "none" as const,
    enter: "fmd-slide-up" as const,
    exit: "fmd-slide-down" as const,
    update: "none" as const,
  },
  deferredUpdate: {
    default: "none" as const,
    enter: "none" as const,
    exit: "none" as const,
    update: "fmd-crossfade" as const,
  },
  content: {
    default: "none" as const,
    enter: "fmd-crossfade" as const,
    exit: "fmd-crossfade" as const,
    update: "fmd-crossfade" as const,
  },
};

export const ViewTransitionShell = ({
  children,
  mode = "deferredUpdate",
}: ViewTransitionShellProps) => {
  const transitionProps = modeProps[mode];

  return (
    <ViewTransition
      default={transitionProps.default}
      enter={transitionProps.enter}
      exit={transitionProps.exit}
      update={transitionProps.update}
    >
      {children}
    </ViewTransition>
  );
};
