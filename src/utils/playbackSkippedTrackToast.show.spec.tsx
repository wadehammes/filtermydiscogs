import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { createElement, Fragment } from "react";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";
import { PLAYBACK_SKIP_HELP_TRIGGER_LABEL } from "src/utils/playbackSkipHelpCopy";
import { render, screen } from "test-utils";

type ShowPersistentQueueAreaErrorToastParams = {
  headerAction?: ReactNode;
};

describe("playbackSkippedTrackToast show wiring", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("passes a help trigger as the toast header action", async () => {
    const mockShow =
      jest.fn<(params: ShowPersistentQueueAreaErrorToastParams) => void>();

    jest.doMock("src/utils/playbackQueueToast", () => ({
      showPersistentQueueAreaErrorToast: mockShow,
    }));

    const toastModule = await import("src/utils/playbackSkippedTrackToast");

    toastModule.appendPlaybackSkipAndSchedule(
      playbackSkipLogEntryFactory.privateOrRemovedOnYoutube({
        context: undefined,
      }),
      jest.fn(),
    );

    expect(mockShow).toHaveBeenCalledTimes(1);

    const headerAction = mockShow.mock.calls[0]?.[0]?.headerAction;

    render(createElement(Fragment, null, headerAction));

    expect(
      screen.getByRole("button", { name: PLAYBACK_SKIP_HELP_TRIGGER_LABEL }),
    ).toBeInTheDocument();
  });
});
