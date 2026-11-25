import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaybackQueueDrawer } from "src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.component";
import { SETTINGS_PLAYBACK_QUEUE_TAIL_HREF } from "src/components/Settings/settingsSections.constants";
import { PLAYBACK_QUEUE_TAIL_SETTINGS_LINK_LABEL } from "src/constants/playbackQueueEmptyCopy.constants";
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

jest.mock("src/hooks/useMediaQuery.hook", () => ({
  useMediaQuery: () => false,
}));

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
    expect(
      screen.getByRole("link", {
        name: PLAYBACK_QUEUE_TAIL_SETTINGS_LINK_LABEL,
      }),
    ).toHaveAttribute("href", SETTINGS_PLAYBACK_QUEUE_TAIL_HREF);
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
