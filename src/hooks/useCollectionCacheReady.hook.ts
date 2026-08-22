import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  prepareCollectionQueryFromCache,
  resetCollectionCacheReady,
} from "src/utils/collectionCacheSync";

export interface UseCollectionCacheReadyParams {
  username: string;
  enabled: boolean;
}

export interface CollectionCacheReadyState {
  ready: boolean;
  hydratedFromCache: boolean;
}

const INITIAL_CACHE_READY_STATE: CollectionCacheReadyState = {
  ready: false,
  hydratedFromCache: false,
};

export const useCollectionCacheReady = ({
  username,
  enabled,
}: UseCollectionCacheReadyParams): CollectionCacheReadyState => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<CollectionCacheReadyState>(
    INITIAL_CACHE_READY_STATE,
  );

  useEffect(() => {
    if (!(enabled && username)) {
      setState(INITIAL_CACHE_READY_STATE);
      return;
    }

    let cancelled = false;
    setState(INITIAL_CACHE_READY_STATE);

    void prepareCollectionQueryFromCache(queryClient, username).then(
      (result) => {
        if (cancelled) {
          return;
        }

        setState({
          ready: true,
          hydratedFromCache: result.hydratedFromCache,
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled, queryClient, username]);

  return state;
};

export { resetCollectionCacheReady };
