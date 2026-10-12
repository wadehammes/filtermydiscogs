import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { createElement, Fragment, type ReactNode } from "react";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";
import {
  createPlaybackSkipLogToast,
  PLAYBACK_SKIP_USER_REPORT_TITLE,
} from "src/utils/playbackSkippedTrackToast";
import { fireEvent, render, screen } from "test-utils";

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
      playbackSkipLogEntryFactory.privateOrRemovedOnYoutube({
        reason: "Private or removed",
        context: undefined,
      }),
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
      playbackSkipLogEntryFactory.privateOrRemovedOnYoutube({
        trackLabel: "A2 Howler - Various, HDZ 06",
        reason: "Private or removed",
        context: undefined,
      }),
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
      playbackSkipLogEntryFactory.build({
        errorCode: 100,
        trackLabel: "First",
        reason: "Private or removed",
        context: undefined,
      }),
      onSkip,
    );
    toast.appendAndScheduleSkip(
      playbackSkipLogEntryFactory.build({
        errorCode: 101,
        trackLabel: "Second",
        reason: "Cannot embed",
        context: undefined,
      }),
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
      playbackSkipLogEntryFactory.build({
        errorCode: 100,
        trackLabel: "First",
        reason: "Private or removed",
        context: undefined,
      }),
      onSkip,
    );
    toast.appendAndScheduleSkip(
      playbackSkipLogEntryFactory.build({
        errorCode: 101,
        trackLabel: "Second",
        reason: "Cannot embed",
        context: undefined,
      }),
      onSkip,
    );

    expect(showToast).toHaveBeenCalledTimes(2);
    expect(onSkip).toHaveBeenCalledTimes(2);
  });

  it("renders a report control for each skipped track", () => {
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
    });

    toast.appendAndScheduleSkip(
      playbackSkipLogEntryFactory.watchdogFallbackReport(),
      onSkip,
    );

    const description = showToast.mock.calls[0]?.[0]?.description;
    render(createElement(Fragment, null, description));

    expect(
      screen.getByRole("button", { name: "Report skip error" }),
    ).toHaveAttribute("title", PLAYBACK_SKIP_USER_REPORT_TITLE);
  });

  it("when Report is clicked, opens the report dialog flow", () => {
    const requestSkipUserReport = jest.fn();
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
      requestSkipUserReport,
    });

    const entry = playbackSkipLogEntryFactory.embedDisabledReport();

    toast.appendAndScheduleSkip(entry, onSkip);

    const initialDescription = showToast.mock.calls[0]?.[0]?.description;
    render(createElement(Fragment, null, initialDescription));

    fireEvent.click(screen.getByRole("button", { name: "Report skip error" }));

    expect(requestSkipUserReport).toHaveBeenCalledTimes(1);
    expect(requestSkipUserReport).toHaveBeenCalledWith(entry);
  });

  it("when one of multiple skips is reported, other rows still request user report", () => {
    const requestSkipUserReport = jest.fn();
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
      requestSkipUserReport,
    });

    const firstEntry = playbackSkipLogEntryFactory.build({
      errorCode: 100,
      trackLabel: "First",
      reason: "Private or removed",
      context: { trackKey: "inst-a1", youtubeVideoId: "vid1" },
    });
    const secondEntry = playbackSkipLogEntryFactory.build({
      errorCode: 101,
      trackLabel: "Second",
      reason: "Cannot embed",
      context: { trackKey: "inst-a2", youtubeVideoId: "vid2" },
    });

    toast.appendAndScheduleSkip(firstEntry, onSkip);
    toast.appendAndScheduleSkip(secondEntry, onSkip);
    toast.completeUserReport(firstEntry, { category: "wrong_video" });

    const updatedDescription = showToast.mock.calls[2]?.[0]?.description;
    render(createElement(Fragment, null, updatedDescription));

    fireEvent.click(screen.getByRole("button", { name: "Report skip error" }));

    expect(requestSkipUserReport).toHaveBeenCalledTimes(1);
    expect(requestSkipUserReport).toHaveBeenCalledWith(secondEntry);
  });

  it("when user report completes, sends to Sentry and shows Sent", () => {
    const submitSkipUserReport = jest.fn();
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
      submitSkipUserReport,
    });

    const entry = playbackSkipLogEntryFactory.embedDisabledReport();

    toast.appendAndScheduleSkip(entry, onSkip);

    toast.completeUserReport(entry, { category: "stuck_loading" });

    expect(submitSkipUserReport).toHaveBeenCalledTimes(1);
    expect(submitSkipUserReport).toHaveBeenCalledWith(entry, {
      category: "stuck_loading",
    });

    const updatedDescription = showToast.mock.calls[1]?.[0]?.description;
    render(createElement(Fragment, null, updatedDescription));

    expect(screen.getByRole("button", { name: "Sent" })).toBeDisabled();
  });

  it("reset dismisses the toast without advancing again", () => {
    const onSkip = jest.fn();
    const toast = createPlaybackSkipLogToast({
      showToast,
      dismissToast,
    });

    toast.appendAndScheduleSkip(
      playbackSkipLogEntryFactory.build({
        errorCode: 100,
        trackLabel: "Track",
        reason: "Private or removed",
        context: undefined,
      }),
      onSkip,
    );
    toast.reset();

    expect(dismissToast).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
