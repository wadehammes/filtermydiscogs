"use client";

import { useEffect, useLayoutEffect } from "react";
import {
  applyReleaseCardCoverBlurFromSession,
  applyReleaseCardCoverBlurTierToDocument,
  readCachedReleaseCardCoverBlurTier,
  scheduleReleaseCardCoverBlurTierMeasure,
} from "src/utils/releaseCardCoverBlurTier";

export const useReleaseCardCoverBlurTierSync = (): void => {
  useLayoutEffect(() => {
    applyReleaseCardCoverBlurFromSession();
  }, []);

  useEffect(() => {
    if (readCachedReleaseCardCoverBlurTier() !== null) {
      return undefined;
    }

    return scheduleReleaseCardCoverBlurTierMeasure(
      applyReleaseCardCoverBlurTierToDocument,
    );
  }, []);
};
