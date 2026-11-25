import { describe, expect, it } from "@jest/globals";
import { createStore } from "jotai";
import {
  activePromotionalToastHostAtom,
  createInitialPromotionalToastEligibility,
  promotionalToastEligibilityAtom,
} from "src/atoms/toastManager.atoms";

describe("toastManager.atoms", () => {
  it("when multiple hosts are eligible, returns the highest-priority host", () => {
    const store = createStore();
    const initial = createInitialPromotionalToastEligibility();

    store.set(promotionalToastEligibilityAtom, {
      ...initial,
      supportProject: true,
      emailAccountCapture: true,
    });

    expect(store.get(activePromotionalToastHostAtom)).toBe("supportProject");
  });

  it("when only a lower-priority host is eligible, returns that host", () => {
    const store = createStore();
    const initial = createInitialPromotionalToastEligibility();

    store.set(promotionalToastEligibilityAtom, {
      ...initial,
      emailAccountCapture: true,
    });

    expect(store.get(activePromotionalToastHostAtom)).toBe(
      "emailAccountCapture",
    );
  });

  it("when no hosts are eligible, returns null", () => {
    const store = createStore();

    expect(store.get(activePromotionalToastHostAtom)).toBeNull();
  });
});
