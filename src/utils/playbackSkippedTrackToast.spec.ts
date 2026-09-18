import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { createElement, Fragment, type ReactNode } from "react";
import { createPlaybackSkipLogToast } from "src/utils/playbackSkippedTrackToast";
import { render, screen } from "test-utils";

type ShowToastParams = {
  title: string;
  description: ReactNode;
  onClose: () => void;
};

describe("createPlaybackSkipLogToast", () => {
  const showToast = jest.fn<(params: ShowToastParams) => void>();
  const dismissToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows a persistent toast and advances the queue immediately", () => {
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
    });

    toast.appendAndScheduleSkip(
      {
        trackLabel: "A1 Track - Artist, Album",
        reason: "Private or removed",
      },
      onSkip,
    );

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("renders a single skip without a bullet list", () => {
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
    });

    toast.appendAndScheduleSkip(
      {
        trackLabel: "A2 Howler - Various, HDZ 06",
        reason: "Private or removed",
      },
      onSkip,
    );

    const description = showToast.mock.calls[0]?.[0]?.description;

    render(createElement(Fragment, null, description));

    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText("A2 Howler - Various, HDZ 06")).toBeInTheDocument();
  });

  it("renders multiple skips as a bullet list", () => {
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
    });

    toast.appendAndScheduleSkip(
      { trackLabel: "First", reason: "Private or removed" },
      onSkip,
    );
    toast.appendAndScheduleSkip(
      { trackLabel: "Second", reason: "Cannot embed" },
      onSkip,
    );

    const description = showToast.mock.calls[1]?.[0]?.description;

    render(createElement(Fragment, null, description));

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("amends the toast and advances again when another track fails", () => {
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
    });

    toast.appendAndScheduleSkip(
      { trackLabel: "First", reason: "Private or removed" },
      onSkip,
    );
    toast.appendAndScheduleSkip(
      { trackLabel: "Second", reason: "Cannot embed" },
      onSkip,
    );

    expect(showToast).toHaveBeenCalledTimes(2);
    expect(onSkip).toHaveBeenCalledTimes(2);
  });

  it("reset dismisses the toast without advancing again", () => {
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
    });

    toast.appendAndScheduleSkip(
      { trackLabel: "Track", reason: "Private or removed" },
      onSkip,
    );
    toast.reset();

    expect(dismissToast).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
