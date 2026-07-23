import { useCallback } from "react";
import type { DiscogsRelease } from "src/types";

interface UseReleaseOpenHandlerParams {
  release: DiscogsRelease;
  onReleaseClick?: ((instanceId: string) => void) | undefined;
}

export const useReleaseOpenHandler = ({
  release,
  onReleaseClick,
}: UseReleaseOpenHandlerParams) => {
  const openRelease = useCallback(() => {
    onReleaseClick?.(String(release.instance_id));
  }, [onReleaseClick, release.instance_id]);

  return {
    openRelease,
    canOpen: onReleaseClick !== undefined,
  };
};
