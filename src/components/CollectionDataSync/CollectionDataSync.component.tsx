"use client";

import { useAuth } from "src/context/auth.context";
import { useCollectionData } from "src/hooks/useCollectionData.hook";

export const CollectionDataSync = () => {
  const { state: authState } = useAuth();

  useCollectionData({
    username: authState.username,
    isAuthenticated: authState.isAuthenticated,
    rateLimited: authState.rateLimited,
    isCheckingAuth: authState.isCheckingAuth,
  });

  return null;
};
