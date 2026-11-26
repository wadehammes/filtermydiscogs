import { describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { BOTTOM_DRAWER_DISMISS_EVENT } from "src/constants/bottomDrawerDismiss";
import type { CrateActions } from "src/context/crate.context";
import { CrateActionsContext } from "src/context/crateContexts";
import {
  PlaybackReleaseClickProvider,
  useRegisterPlaybackReleaseClick,
} from "src/context/playbackReleaseClick.context";
import { usePlaybackReleaseClickWithDismiss } from "src/hooks/usePlaybackReleaseClickWithDismiss.hook";
import { act, renderHookWithTestProviders as renderHook } from "test-utils";

let testCrateActions: CrateActions | undefined;

const PlaybackCrateActionsTestWrapper = ({
  children,
}: {
  children: ReactNode;
}) => (
  <PlaybackReleaseClickProvider>
    <CrateActionsContext.Provider value={testCrateActions as CrateActions}>
      {children}
    </CrateActionsContext.Provider>
  </PlaybackReleaseClickProvider>
);

const useDismissWithRegisteredHandler = (
  handler: (instanceId: string) => void,
) => {
  useRegisterPlaybackReleaseClick(handler);
  return usePlaybackReleaseClickWithDismiss();
};

describe("usePlaybackReleaseClickWithDismiss", () => {
  it("dismisses overlay drawers and invokes the registered handler", () => {
    const handler = jest.fn();
    const dispatchEvent = jest.spyOn(window, "dispatchEvent");

    const { result } = renderHook(
      () => useDismissWithRegisteredHandler(handler),
      { includeCollectionSync: false },
    );

    act(() => {
      result.current("instance-42");
    });

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: BOTTOM_DRAWER_DISMISS_EVENT }),
    );
    expect(handler).toHaveBeenCalledWith("instance-42");

    dispatchEvent.mockRestore();
  });

  it("calls closeDrawer when crate actions are available", () => {
    const handler = jest.fn();
    const closeDrawer = jest.fn();
    testCrateActions = { closeDrawer } as unknown as CrateActions;

    const { result } = renderHook(
      () => useDismissWithRegisteredHandler(handler),
      {
        wrapper: PlaybackCrateActionsTestWrapper,
        includeCollectionSync: false,
        includeCrate: false,
      },
    );

    act(() => {
      result.current("instance-7");
    });

    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("instance-7");
  });
});
