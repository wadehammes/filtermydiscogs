"use client";

import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { ReleaseModalLazy } from "./ReleaseModalLazy.component";

interface ReleaseModalLazyOverlayProps {
  release: DiscogsRelease | null;
  onClose: () => void;
  onReleaseClick?: (instanceId: string) => void;
}

export const ReleaseModalLazyOverlay = ({
  release,
  onClose,
  onReleaseClick,
}: ReleaseModalLazyOverlayProps) => {
  if (!release) {
    return null;
  }

  return (
    <ReleaseModalLazy
      isOpen={true}
      release={release}
      onClose={onClose}
      {...definedProps({ onReleaseClick })}
    />
  );
};
