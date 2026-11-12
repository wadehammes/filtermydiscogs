"use client";

import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";

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
    <ReleaseModal
      key={String(release.instance_id)}
      isOpen={true}
      release={release}
      onClose={onClose}
      {...definedProps({ onReleaseClick })}
    />
  );
};
