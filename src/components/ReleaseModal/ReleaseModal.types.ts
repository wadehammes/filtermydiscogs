import type { DiscogsRelease } from "src/types";

export interface ReleaseModalProps {
  isOpen: boolean;
  release: DiscogsRelease | null;
  onClose: () => void;
  onReleaseClick?: (instanceId: string) => void;
}
