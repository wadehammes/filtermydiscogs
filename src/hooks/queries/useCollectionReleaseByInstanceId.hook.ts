"use client";

import { useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease } from "src/types";
import {
  buildCollectionReleaseIndex,
  buildReleaseIndexFromList,
} from "src/utils/collectionReleaseLookup";
import { useDiscogsCollectionQuery } from "./useDiscogsCollectionQuery";

export interface UseCollectionReleaseByInstanceIdParams {
  username: string | null | undefined;
  instanceId: string | null;
  enabled?: boolean;
}

export const useCollectionReleaseByInstanceId = ({
  username,
  instanceId,
  enabled = true,
}: UseCollectionReleaseByInstanceIdParams): DiscogsRelease | null => {
  const allReleases = useAllReleases();
  const { data } = useDiscogsCollectionQuery({
    username: username ?? "",
    enabled: enabled && !!username && !!instanceId,
  });

  const releaseIndex = useMemo(() => {
    if (allReleases.length > 0) {
      return buildReleaseIndexFromList(allReleases);
    }

    if (!data?.pages?.length) {
      return null;
    }

    return buildCollectionReleaseIndex(data.pages);
  }, [allReleases, data?.pages]);

  return useMemo(() => {
    if (!(instanceId && releaseIndex)) {
      return null;
    }

    return releaseIndex.get(String(instanceId)) ?? null;
  }, [instanceId, releaseIndex]);
};
