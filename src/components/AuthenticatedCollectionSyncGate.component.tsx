"use client";

import { CollectionDataSync } from "src/components/CollectionDataSync/CollectionDataSync.component";
import { useAuth } from "src/context/auth.context";

export const AuthenticatedCollectionSyncGate = () => {
  const { state: authState } = useAuth();

  if (!authState.isAuthenticated) {
    return null;
  }

  return <CollectionDataSync />;
};
