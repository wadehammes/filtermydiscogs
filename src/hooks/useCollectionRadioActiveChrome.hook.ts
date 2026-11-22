"use client";

import { useSetAtom } from "jotai";
import { useCallback } from "react";
import {
  collectionRadioActiveAtom,
  collectionRadioSessionReleaseIdsKeyAtom,
} from "src/atoms/collectionRadioPlayback.atoms";

export const useCollectionRadioActiveChrome = () => {
  const setCollectionRadioActive = useSetAtom(collectionRadioActiveAtom);
  const setSessionReleaseIdsKey = useSetAtom(
    collectionRadioSessionReleaseIdsKeyAtom,
  );

  const clearCollectionRadioActive = useCallback(() => {
    setCollectionRadioActive(false);
    setSessionReleaseIdsKey(null);
  }, [setCollectionRadioActive, setSessionReleaseIdsKey]);

  return { clearCollectionRadioActive };
};
