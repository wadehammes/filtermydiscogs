"use client";

import { useMemo } from "react";
import type { DiscogsRelease } from "src/types";
import { findCollectionReleaseByInstanceId } from "src/utils/collectionReleaseLookup";
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
  const { data } = useDiscogsCollectionQuery({
    username: username ?? "",
    enabled: enabled && !!username && !!instanceId,
  });

  return useMemo(() => {
    if (!(instanceId && data?.pages?.length)) {
      return null;
    }

    return findCollectionReleaseByInstanceId(data.pages, instanceId);
  }, [data?.pages, instanceId]);
};
