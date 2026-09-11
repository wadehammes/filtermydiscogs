import userEvent from "@testing-library/user-event";
import { RELEASE_OPEN_PREFETCH_HOVER_MS } from "src/hooks/useReleaseOpenHandler.hook";
import { waitFor } from "test-utils";

interface ExpectReleaseOpenPrefetchAfterHoverParams {
  hoverTarget: HTMLElement;
  mockDiscogsRelease: jest.Mock;
  user: ReturnType<typeof userEvent.setup>;
}

export const setupReleaseOpenPrefetchHoverTimers = () => {
  jest.useFakeTimers();

  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
};

export const teardownReleaseOpenPrefetchHoverTimers = () => {
  jest.useRealTimers();
};

export const expectReleaseOpenPrefetchAfterHover = async ({
  hoverTarget,
  mockDiscogsRelease,
  user,
}: ExpectReleaseOpenPrefetchAfterHoverParams): Promise<void> => {
  await user.hover(hoverTarget);

  expect(mockDiscogsRelease).not.toHaveBeenCalled();

  jest.advanceTimersByTime(RELEASE_OPEN_PREFETCH_HOVER_MS);

  await waitFor(() => {
    expect(mockDiscogsRelease).toHaveBeenCalled();
  });
};

export const expectNoReleaseOpenPrefetchAfterHover = async ({
  hoverTarget,
  mockDiscogsRelease,
  user,
}: ExpectReleaseOpenPrefetchAfterHoverParams): Promise<void> => {
  await user.hover(hoverTarget);

  jest.advanceTimersByTime(RELEASE_OPEN_PREFETCH_HOVER_MS);

  expect(mockDiscogsRelease).not.toHaveBeenCalled();
};
