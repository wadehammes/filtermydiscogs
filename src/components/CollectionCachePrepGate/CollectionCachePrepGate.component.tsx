"use client";

import { useAuth } from "src/context/auth.context";
import { useCollectionCacheReady } from "src/hooks/useCollectionCacheReady.hook";
import { resolveCollectionCacheUsername } from "src/utils/resolveCollectionCacheUsername";

export const CollectionCachePrepGate = () => {
  const { state: authState } = useAuth();
  const prepUsername = resolveCollectionCacheUsername(authState);

  useCollectionCacheReady({
    username: prepUsername ?? "",
    enabled: Boolean(prepUsername),
  });

  return null;
};
