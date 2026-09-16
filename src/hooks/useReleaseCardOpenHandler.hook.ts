import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { DiscogsRelease } from "src/types";
import { prefetchReleaseModalChunk } from "src/utils/prefetchReleaseModalChunk";

interface UseReleaseCardOpenHandlerParams {
  release: DiscogsRelease | null | undefined;
  onReleaseClick?: ((instanceId: string) => void) | undefined;
}

export const useReleaseCardOpenHandler = (
  params: UseReleaseCardOpenHandlerParams,
) =>
  useReleaseOpenHandler({
    ...params,
    onPrefetch: prefetchReleaseModalChunk,
  });
