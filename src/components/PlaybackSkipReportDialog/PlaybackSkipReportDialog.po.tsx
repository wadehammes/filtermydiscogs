import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";
import { render } from "test-utils";
import {
  PlaybackSkipReportDialog,
  type PlaybackSkipReportDialogProps,
} from "./PlaybackSkipReportDialog.component";

export type PlaybackSkipUserReportSubmitHandler =
  PlaybackSkipReportDialogProps["onSubmitUserReport"];

export const mockPlaybackSkipUserReportSubmit = (delivered = false) =>
  jest.fn<
    ReturnType<PlaybackSkipUserReportSubmitHandler>,
    Parameters<PlaybackSkipUserReportSubmitHandler>
  >(async (_entry, _report) => delivered);

export type PlaybackSkipReportDialogRenderProps = Partial<
  Pick<
    PlaybackSkipReportDialogProps,
    "open" | "entry" | "onClose" | "onSubmitUserReport"
  >
>;

export class PlaybackSkipReportDialogPageObject extends BasePageObject {
  public testId = "fmdPlaybackSkipReportDialog";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private PlaybackSkipReportDialogElement(
    overrides: PlaybackSkipReportDialogRenderProps = {},
  ) {
    const entry =
      overrides.entry ?? playbackSkipLogEntryFactory.embedDisabledReport();

    const {
      open,
      onClose,
      onSubmitUserReport,
      entry: entryOverride,
    } = overrides;

    return (
      <PlaybackSkipReportDialog
        entry={entryOverride ?? entry}
        open={open ?? true}
        onClose={onClose ?? jest.fn()}
        onSubmitUserReport={
          onSubmitUserReport ?? mockPlaybackSkipUserReportSubmit()
        }
      />
    );
  }

  renderPlaybackSkipReportDialog(
    overrides: PlaybackSkipReportDialogRenderProps = {},
  ): RenderResult {
    return render(this.PlaybackSkipReportDialogElement(overrides));
  }

  rerenderPlaybackSkipReportDialog(
    rerender: RenderResult["rerender"],
    overrides: PlaybackSkipReportDialogRenderProps = {},
  ): void {
    rerender(this.PlaybackSkipReportDialogElement(overrides));
  }
}
