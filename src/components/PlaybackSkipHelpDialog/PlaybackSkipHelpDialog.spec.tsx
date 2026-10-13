import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaybackSkipHelpDialogPageObject } from "src/components/PlaybackSkipHelpDialog/PlaybackSkipHelpDialog.po";
import { PLAYBACK_SKIP_HELP_TRIGGER_LABEL } from "src/utils/playbackSkipHelpCopy";
import { registerPlaybackSkipHelpDialogOpen } from "src/utils/playbackSkipHelpDialogBridge";
import { screen } from "test-utils";

let po: PlaybackSkipHelpDialogPageObject;

describe("PlaybackSkipHelpDialog", () => {
  beforeEach(() => {
    po = new PlaybackSkipHelpDialogPageObject();
    jest.clearAllMocks();
  });

  it("lists skip reasons and guidance when open", () => {
    po.renderDialog({ onClose: jest.fn() });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByText("Private or removed on YouTube"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cannot play in embedded player"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Wrong skip\? Use Report/i)).toBeInTheDocument();
  });

  it("when Got it is pressed, closes the dialog", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    po.renderDialog({ onClose });

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("when the toast help trigger is clicked, opens the dialog via the host", async () => {
    const user = userEvent.setup();

    po.renderHostWithTrigger();

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: PLAYBACK_SKIP_HELP_TRIGGER_LABEL }),
    );

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("toast help trigger opens a registered dialog handler", async () => {
    const user = userEvent.setup();
    const onOpen = jest.fn();

    registerPlaybackSkipHelpDialogOpen(onOpen);
    po.renderToastTrigger();

    await user.click(
      screen.getByRole("button", { name: PLAYBACK_SKIP_HELP_TRIGGER_LABEL }),
    );

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
