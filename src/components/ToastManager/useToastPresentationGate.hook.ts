"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  activePromotionalToastHostAtom,
  promotionalToastEligibilityAtom,
} from "src/atoms/toastManager.atoms";
import type { PromotionalToastHostId } from "src/components/ToastManager/toastHostIds.constants";

export const useToastPresentationGate = (
  hostId: PromotionalToastHostId,
  eligible: boolean,
): boolean => {
  const setEligibility = useSetAtom(promotionalToastEligibilityAtom);
  const activeHost = useAtomValue(activePromotionalToastHostAtom);

  useEffect(() => {
    setEligibility((previous) => {
      if (previous[hostId] === eligible) {
        return previous;
      }

      return {
        ...previous,
        [hostId]: eligible,
      };
    });

    return () => {
      setEligibility((previous) => {
        if (!previous[hostId]) {
          return previous;
        }

        return {
          ...previous,
          [hostId]: false,
        };
      });
    };
  }, [eligible, hostId, setEligibility]);

  return activeHost === hostId;
};
