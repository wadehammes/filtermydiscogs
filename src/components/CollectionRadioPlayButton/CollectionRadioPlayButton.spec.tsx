import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CollectionRadioPlayButtonPageObject } from "src/components/CollectionRadioPlayButton/CollectionRadioPlayButton.po";
import {
  COLLECTION_RADIO_PLAY_TOOLTIP,
  COLLECTION_RADIO_PREPARING_LABEL,
  COLLECTION_RADIO_QUEUE_BUILDING_LABEL,
} from "src/constants/collectionRadio.constants";
import { screen, waitFor } from "test-utils";

const mockStartCollectionRadio = jest.fn();
const mockTogglePlayback = jest.fn();

jest.mock("src/context/releasePlayback.context", () => ({
  useReleasePlaybackActions: () => ({
    togglePlayback: mockTogglePlayback,
  }),
}));

const mockUseCollectionRadioPlayback = jest.fn(() => ({
  startCollectionRadio: mockStartCollectionRadio,
  isStarting: false,
  isPrefetching: false,
  isDetailsReady: true,
  filteredReleaseCount: 2,
  isCollectionRadioActive: false,
}));

jest.mock("src/hooks/useCollectionRadioPlayback.hook", () => ({
  useCollectionRadioPlayback: () => mockUseCollectionRadioPlayback(),
}));

let po: CollectionRadioPlayButtonPageObject;

describe("CollectionRadioPlayButton", () => {
  beforeEach(() => {
    mockStartCollectionRadio.mockReset();
    mockTogglePlayback.mockReset();
    po = new CollectionRadioPlayButtonPageObject();
    mockUseCollectionRadioPlayback.mockImplementation(() => ({
      startCollectionRadio: mockStartCollectionRadio,
      isStarting: false,
      isPrefetching: false,
      isDetailsReady: true,
      filteredReleaseCount: 2,
      isCollectionRadioActive: false,
    }));
  });

  it("does not render when filters and saved views are inactive", () => {
    po.renderCollectionRadioPlayButton();

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
  });

  it("renders when collection filters are active", () => {
    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Play collection radio" }),
    ).toBeEnabled();
  });

  it("shows a tooltip explaining collection radio on hover", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    await user.hover(
      screen.getByRole("button", { name: "Play collection radio" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdCollectionRadioPlayTooltip")).toBeVisible();
    });
    expect(
      screen.getByTestId("fmdCollectionRadioPlayTooltip"),
    ).toHaveTextContent(COLLECTION_RADIO_PLAY_TOOLTIP);
  });

  it("shows a spinner while the radio queue is building", () => {
    mockUseCollectionRadioPlayback.mockImplementation(() => ({
      startCollectionRadio: mockStartCollectionRadio,
      isStarting: true,
      isPrefetching: false,
      isDetailsReady: true,
      filteredReleaseCount: 2,
      isCollectionRadioActive: false,
    }));

    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    const button = screen.getByRole("button", {
      name: COLLECTION_RADIO_QUEUE_BUILDING_LABEL,
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("progressbar", {
        name: COLLECTION_RADIO_QUEUE_BUILDING_LABEL,
      }),
    ).toBeInTheDocument();
  });

  it("shows a spinner while release details are prefetching", () => {
    mockUseCollectionRadioPlayback.mockImplementation(() => ({
      startCollectionRadio: mockStartCollectionRadio,
      isStarting: false,
      isPrefetching: true,
      isDetailsReady: false,
      filteredReleaseCount: 2,
      isCollectionRadioActive: false,
    }));

    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    const button = screen.getByRole("button", {
      name: COLLECTION_RADIO_PREPARING_LABEL,
    });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeEnabled();
    expect(
      screen.getByRole("progressbar", {
        name: COLLECTION_RADIO_PREPARING_LABEL,
      }),
    ).toBeInTheDocument();
  });

  it("starts collection radio when the play control is pressed", async () => {
    const user = userEvent.setup();

    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Jazz"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Play collection radio" }),
    );

    expect(mockStartCollectionRadio).toHaveBeenCalledTimes(1);
  });

  it("marks the control pressed while collection radio is actively playing", () => {
    mockUseCollectionRadioPlayback.mockImplementation(() => ({
      startCollectionRadio: mockStartCollectionRadio,
      isStarting: false,
      isPrefetching: false,
      isDetailsReady: true,
      filteredReleaseCount: 2,
      isCollectionRadioActive: true,
    }));

    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    const button = screen.getByRole("button", {
      name: "Pause collection radio",
    });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("pauses collection radio when the control is pressed while playing", async () => {
    const user = userEvent.setup();

    mockUseCollectionRadioPlayback.mockImplementation(() => ({
      startCollectionRadio: mockStartCollectionRadio,
      isStarting: false,
      isPrefetching: false,
      isDetailsReady: true,
      filteredReleaseCount: 2,
      isCollectionRadioActive: true,
    }));

    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Pause collection radio" }),
    );

    expect(mockTogglePlayback).toHaveBeenCalledTimes(1);
    expect(mockStartCollectionRadio).not.toHaveBeenCalled();
  });
});
