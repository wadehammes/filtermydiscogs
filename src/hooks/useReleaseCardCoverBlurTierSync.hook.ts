"use client";

import { useEffect, useLayoutEffect } from "react";
import {
  applyReleaseCardCoverBlurTierToDocument,
  readCachedReleaseCardCoverBlurTier,
  scheduleReleaseCardCoverBlurTierMeasure,
} from "src/utils/releaseCardCoverBlurTier";

export const useReleaseCardCoverBlurTierSync = (): void => {
  useLayoutEffect(() => {
    const cached = readCachedReleaseCardCoverBlurTier();
    applyReleaseCardCoverBlurTierToDocument(cached ?? "hover-only");
  }, []);

  useEffect(() => {
    if (readCachedReleaseCardCoverBlurTier() !== null) {
      return undefined;
    }

    return scheduleReleaseCardCoverBlurTierMeasure((tier) => {
      applyReleaseCardCoverBlurTierToDocument(tier);
    });
  }, []);
};
