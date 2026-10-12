import type { RenderResult } from "@testing-library/react";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { playbackSkipLogEntryFactory } from "src/tests/factories/PlaybackSkipLogEntry.factory";
import type { PlaybackSkipLogEntry } from "src/utils/playbackSkippedTrackLog";
import { render } from "test-utils";
import { PlaybackSkipReportDialog } from "./PlaybackSkipReportDialog.component";

export type PlaybackSkipReportDialogRenderProps = {
  open?: boolean;
  entry?: PlaybackSkipLogEntry | null;
  onClose?: () => void;
  onSubmitUserReport?: (
    entry: PlaybackSkipLogEntry,
    report: PlaybackSkipUserReportFormValues,
  ) => void;
};

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
        onSubmitUserReport={onSubmitUserReport ?? jest.fn()}
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
