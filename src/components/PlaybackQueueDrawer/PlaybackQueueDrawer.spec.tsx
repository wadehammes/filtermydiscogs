import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaybackQueueDrawer } from "src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type { ReleasePlaybackState } from "src/types/releasePlaybackContext.types";
import { createQueueItem } from "src/utils/playbackQueue";
import { render, screen } from "test-utils";

const release = releaseFactory.withDisplayDefaults();
const queueItem: PlaybackQueueItem = createQueueItem({
  release,
  trackPosition: "A1",
  trackTitle: "First",
});

const basePlaybackState: Pick<
  ReleasePlaybackState,
  | "isQueueBuilding"
  | "isSimilarQueueLoading"
  | "isCollectionRadioQueueLoading"
  | "queueAutopopulateSource"
> = {
  isQueueBuilding: false,
  isSimilarQueueLoading: false,
  isCollectionRadioQueueLoading: false,
  queueAutopopulateSource: null,
};

jest.mock("src/context/releasePlayback.context", () => ({
  useReleasePlaybackQueue: () => ({
    queue: [queueItem],
    playQueueAtIndex: jest.fn(),
    removeFromQueue: jest.fn(),
    reorderQueue: jest.fn(),
    clearQueue: jest.fn(),
  }),
  useReleasePlaybackState: jest.fn(() => basePlaybackState),
}));

const { useReleasePlaybackState } = jest.requireMock(
  "src/context/releasePlayback.context",
) as { useReleasePlaybackState: jest.Mock };

describe("PlaybackQueueDrawer", () => {
  it("shows similar-tail autopopulate status in the queue drawer", () => {
    useReleasePlaybackState.mockReturnValue({
      ...basePlaybackState,
      queueAutopopulateSource: "similar-tail",
    });

    render(<PlaybackQueueDrawer isOpen onClose={jest.fn()} />);

    expect(
      screen.getByTestId("fmdPlaybackQueueBuildingStatus"),
    ).toHaveTextContent("Similar releases");
    expect(
      screen.getByTestId("fmdPlaybackQueueBuildingStatus"),
    ).toHaveAttribute("data-queue-autopopulate-source", "similar-tail");
  });

  it("shows collection radio loading status in the queue drawer", () => {
    useReleasePlaybackState.mockReturnValue({
      ...basePlaybackState,
      isCollectionRadioQueueLoading: true,
      isQueueBuilding: true,
      queueAutopopulateSource: "collection-radio",
    });

    render(<PlaybackQueueDrawer isOpen onClose={jest.fn()} />);

    expect(
      screen.getByTestId("fmdPlaybackQueueBuildingStatus"),
    ).toHaveTextContent("Collection radio is adding");
  });

  it("marks the queue list busy while similar tail autopopulate is loading", () => {
    useReleasePlaybackState.mockReturnValue({
      ...basePlaybackState,
      isSimilarQueueLoading: true,
      isQueueBuilding: true,
      queueAutopopulateSource: "similar-tail",
    });

    render(<PlaybackQueueDrawer isOpen onClose={jest.fn()} />);

    expect(
      screen.getByTestId("fmdPlaybackQueueBuildingStatus"),
    ).toHaveTextContent("Adding similar releases");
    expect(screen.getByTestId("fmdPlaybackQueueList")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("keeps reordering enabled while queue status is shown", async () => {
    useReleasePlaybackState.mockReturnValue({
      ...basePlaybackState,
      queueAutopopulateSource: "collection-radio",
    });

    render(<PlaybackQueueDrawer isOpen onClose={jest.fn()} />);
    const user = userEvent.setup();

    expect(screen.getByRole("button", { name: "Reorder First" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Reorder First" }));
  });
});
