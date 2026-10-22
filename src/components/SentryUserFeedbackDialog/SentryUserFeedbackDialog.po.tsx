import type { Attachment } from "@sentry/core";
import type { RenderResult } from "@testing-library/react";
import { useLayoutEffect, useRef } from "react";
import {
  PlaybackPageShellProvider,
  usePlaybackPageShellMountSetters,
} from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import type { SentryUserFeedbackFormValues } from "src/lib/validation/sentryUserFeedback.schemas";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { SentryUserFeedbackDialog } from "./SentryUserFeedbackDialog.component";

const PlaybackOverlayPortalMarker = () => {
  const portalRef = useRef<HTMLDivElement>(null);
  const { setOverlayPortalElement } = usePlaybackPageShellMountSetters();

  useLayoutEffect(() => {
    setOverlayPortalElement(portalRef.current);

    return () => {
      setOverlayPortalElement(null);
    };
  }, [setOverlayPortalElement]);

  return <div ref={portalRef} data-testid="fmdPlaybackOverlayPortal" />;
};

export type SentryUserFeedbackDialogRenderProps = {
  open?: boolean;
  defaultName?: string;
  onClose?: () => void;
  onSubmitFeedback?: (
    values: SentryUserFeedbackFormValues,
    screenshot?: Attachment,
  ) => void;
  onCaptureScreenshot?: () => Promise<Attachment | undefined>;
  screenshotCaptureSupported?: boolean;
};

export class SentryUserFeedbackDialogPageObject extends BasePageObject {
  public testId = "fmdSentryUserFeedbackDialog";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private SentryUserFeedbackDialogElement(
    overrides: SentryUserFeedbackDialogRenderProps = {},
  ) {
    const {
      open,
      defaultName,
      onClose,
      onSubmitFeedback,
      onCaptureScreenshot,
      screenshotCaptureSupported,
    } = overrides;

    return (
      <SentryUserFeedbackDialog
        defaultName={defaultName ?? ""}
        open={open ?? true}
        onClose={onClose ?? jest.fn()}
        onSubmitFeedback={onSubmitFeedback ?? jest.fn()}
        {...(onCaptureScreenshot ? { onCaptureScreenshot } : {})}
        {...(screenshotCaptureSupported !== undefined
          ? { screenshotCaptureSupported }
          : {})}
      />
    );
  }

  renderSentryUserFeedbackDialog(
    overrides: SentryUserFeedbackDialogRenderProps = {},
  ): RenderResult {
    return render(this.SentryUserFeedbackDialogElement(overrides));
  }

  renderSentryUserFeedbackDialogInPlaybackShell(
    overrides: SentryUserFeedbackDialogRenderProps = {},
  ): RenderResult {
    return render(
      <PlaybackPageShellProvider scrollElement={null}>
        <PlaybackOverlayPortalMarker />
        {this.SentryUserFeedbackDialogElement(overrides)}
      </PlaybackPageShellProvider>,
    );
  }

  rerenderSentryUserFeedbackDialog(
    rerender: RenderResult["rerender"],
    overrides: SentryUserFeedbackDialogRenderProps = {},
  ): void {
    rerender(this.SentryUserFeedbackDialogElement(overrides));
  }
}
