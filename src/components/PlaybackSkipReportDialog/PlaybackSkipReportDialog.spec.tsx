import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaybackSkipReportDialogPageObject } from "src/components/PlaybackSkipReportDialog/PlaybackSkipReportDialog.po";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";
import { screen } from "test-utils";

let po: PlaybackSkipReportDialogPageObject;

describe("PlaybackSkipReportDialog", () => {
  beforeEach(() => {
    po = new PlaybackSkipReportDialogPageObject();
    jest.clearAllMocks();
  });

  it("when Send report is submitted with a category, completes the user report", async () => {
    const user = userEvent.setup();
    const onSubmitUserReport = jest.fn();
    const entry = playbackSkipLogEntryFactory.embedDisabledReport();
    const onClose = jest.fn();

    po.renderPlaybackSkipReportDialog({ entry, onClose, onSubmitUserReport });

    await user.click(
      screen.getByRole("radio", { name: "Plays on YouTube but not here" }),
    );
    await user.click(screen.getByRole("button", { name: "Send report" }));

    expect(onSubmitUserReport).toHaveBeenCalledWith(entry, {
      category: "plays_on_youtube_not_here",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("when Send report is clicked without a category, shows validation message", async () => {
    const user = userEvent.setup();

    po.renderPlaybackSkipReportDialog({
      onClose: jest.fn(),
      onSubmitUserReport: jest.fn(),
    });

    await user.click(screen.getByRole("button", { name: "Send report" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Choose an option");
  });

  it("when dialog closes and reopens, clears the selected category", async () => {
    const user = userEvent.setup();
    const { rerender } = po.renderPlaybackSkipReportDialog({
      open: true,
      onClose: jest.fn(),
      onSubmitUserReport: jest.fn(),
    });

    await user.click(screen.getByRole("radio", { name: "Wrong video" }));

    po.rerenderPlaybackSkipReportDialog(rerender, { open: false });
    po.rerenderPlaybackSkipReportDialog(rerender, { open: true });

    expect(
      screen.getByRole("radio", { name: "Wrong video" }),
    ).not.toBeChecked();
  });
});
