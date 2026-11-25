import { atom } from "jotai";
import {
  PROMOTIONAL_TOAST_HOSTS_BY_PRIORITY,
  type PromotionalToastHostId,
} from "src/components/ToastManager/toastHostIds.constants";

export type PromotionalToastEligibility = Record<
  PromotionalToastHostId,
  boolean
>;

export const createInitialPromotionalToastEligibility =
  (): PromotionalToastEligibility =>
    Object.fromEntries(
      PROMOTIONAL_TOAST_HOSTS_BY_PRIORITY.map((hostId) => [hostId, false]),
    ) as PromotionalToastEligibility;

export const promotionalToastEligibilityAtom =
  atom<PromotionalToastEligibility>(createInitialPromotionalToastEligibility());

export const activePromotionalToastHostAtom = atom((get) => {
  const eligibility = get(promotionalToastEligibilityAtom);

  for (const hostId of PROMOTIONAL_TOAST_HOSTS_BY_PRIORITY) {
    if (eligibility[hostId]) {
      return hostId;
    }
  }

  return null;
});
