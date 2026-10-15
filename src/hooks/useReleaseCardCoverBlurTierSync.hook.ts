"use client";

import { useLayoutEffect } from "react";
import {
  applyReleaseCardCoverBlurTierToDocument,
  resolveReleaseCardCoverBlurTier,
} from "src/utils/releaseCardCoverBlurTier";

export const useReleaseCardCoverBlurTierSync = (): void => {
  useLayoutEffect(() => {
    const tier = resolveReleaseCardCoverBlurTier();
    applyReleaseCardCoverBlurTierToDocument(tier);
  }, []);
};
