import { describe, expect, it } from "@jest/globals";
import { createStore, Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import {
  activePromotionalToastHostAtom,
  createInitialPromotionalToastEligibility,
  promotionalToastEligibilityAtom,
} from "src/atoms/toastManager.atoms";
import { useToastPresentationGate } from "src/components/ToastManager/useToastPresentationGate.hook";
import { renderHook, waitFor } from "test-utils";

const createJotaiWrapper =
  (store: ReturnType<typeof createStore>) =>
  ({ children }: { children: ReactNode }) => (
    <JotaiProvider store={store}>{children}</JotaiProvider>
  );

describe("useToastPresentationGate", () => {
  it("when this host is eligible and no higher-priority host is active, returns true", async () => {
    const store = createStore();

    const { result } = renderHook(
      () => useToastPresentationGate("emailAccountCapture", true),
      { wrapper: createJotaiWrapper(store) },
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    expect(store.get(activePromotionalToastHostAtom)).toBe(
      "emailAccountCapture",
    );
  });

  it("when unmounted, clears this host eligibility so another host may present", async () => {
    const store = createStore();

    const { result, unmount } = renderHook(
      () => useToastPresentationGate("emailAccountCapture", true),
      { wrapper: createJotaiWrapper(store) },
    );

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    unmount();

    await waitFor(() => {
      expect(store.get(activePromotionalToastHostAtom)).toBeNull();
    });
  });

  it("when a higher-priority host is eligible, returns false", async () => {
    const store = createStore();
    const initial = createInitialPromotionalToastEligibility();
    store.set(promotionalToastEligibilityAtom, {
      ...initial,
      supportProject: true,
    });

    const { result } = renderHook(
      () => useToastPresentationGate("emailAccountCapture", true),
      { wrapper: createJotaiWrapper(store) },
    );

    await waitFor(() => {
      expect(store.get(activePromotionalToastHostAtom)).toBe("supportProject");
    });

    expect(result.current).toBe(false);
  });
});
