import type { ComponentType } from "react";
import type { ReleaseModalProps } from "src/components/ReleaseModal/ReleaseModal.component";

export const loadReleaseModal = (): Promise<ComponentType<ReleaseModalProps>> =>
  import("src/components/ReleaseModal/ReleaseModal.component").then(
    (mod) => mod.ReleaseModal,
  );
