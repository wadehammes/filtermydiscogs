import type { DiscogsRelease } from "src/types";

export type ReleaseSimilarSidebarProps = {
  similarReleases: DiscogsRelease[];
  totalSimilarMatchCount?: number;
  similarPageCount?: number;
  similarPageIndex?: number;
  isLoading?: boolean;
  canGoSimilarPagePrev?: boolean;
  canGoSimilarPageNext?: boolean;
  onSimilarPagePrev?: () => void;
  onSimilarPageNext?: () => void;
  onReleaseClick?: (instanceId: string) => void;
  variant?: "aside" | "inline";
};
